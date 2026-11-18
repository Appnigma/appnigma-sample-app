import {
  SdkAuthError,
  SdkError,
  SdkInputError,
  SdkLogicFailedError,
  SdkNetworkError,
  SdkNotAvailableError,
  SdkNotFoundError,
  SdkPlatformRefusedError,
  SdkRateLimitError,
  SdkReconnectError,
  SdkRetiredError,
  SdkServerError,
  SdkWebhookSignatureError,
} from "@appnigma/sdk";
import type { SdkErrorCode } from "@appnigma/sdk";
import type { Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { currentEndCustomerId, SignInRequiredError } from "./session.js";

// What a user is told for each refusal code, in plain words. A code missing
// here falls back to the message for its error class below.
const MESSAGE_BY_CODE: Partial<Record<SdkErrorCode, string>> = {
  PLATFORM_NOT_ENABLED: "That integration is not available yet.",
  PORTAL_NOT_ENABLED: "Automations are not switched on for your account yet.",
  SYNC_NOT_ENABLED: "Noticing changes is not switched on for your account yet.",
  PORTAL_NOT_AVAILABLE: "The automation editor is not available for your account right now.",
  END_CUSTOMER_LOGIC_NOT_AVAILABLE: "Changing automations is not available for your workspace right now. You can still read and try them.",
  REPO_ACCESS_REFUSED: "Automations cannot go live right now. Our team has been told.",
  MISSING_SCOPES: "This connection is missing a permission it needs. Connect it again and approve everything it asks for.",
  END_CUSTOMER_NOT_FOUND: "That is not connected yet.",
  RECORD_NOT_FOUND: "That record no longer exists.",
  ACTION_NOT_FOUND: "That action is not available for this integration.",
  FUNCTION_NOT_FOUND: "That function does not exist.",
  LOGIC_NOT_FOUND: "That automation no longer exists.",
  WEBHOOK_NOT_FOUND: "That webhook no longer exists.",
  FUNCTION_RETIRED: "That function was removed and will not answer again.",
  DATA_TYPE_NOT_AVAILABLE: "That data is not available for this platform yet.",
  DRAFT_CHANGED: "This automation changed since you opened it. Reload to see the latest, then try again.",
  LOGIC_NAME_TAKEN: "An automation with that name already exists. Pick another name.",
  TOO_MANY_DRAFTS: "You have too many unfinished automations. Put one live or throw one away first.",
  PLATFORM_NOT_CONNECTED: "Connect that integration first.",
  NOTHING_TO_GO_LIVE: "There is no change to put live.",
  FILE_CHANGED: "Someone put a newer version live since this change began. Reload and make the change again.",
  SETTINGS_MISSING: "This automation needs settings you have not set yet.",
  LOGIC_NOT_ALWAYS_ON: "This automation only runs when it is called, so it has no on and off switch.",
  LOGIC_CHECK_FAILED: "This change does not pass the checks yet. Ask for a fix, then try again.",
  CONNECT_LOGIN_REJECTED: "Those details were not accepted. Check them and try again.",
  CONNECT_KEY_CHANGED: "That did not go through. Send it again.",
  WEBHOOK_LIMIT_REACHED: "You already have five webhooks. Delete one first.",
  WEBHOOK_EXISTS: "There is already a webhook at that address.",
  WEBHOOK_ADDRESS_REFUSED: "That address can't take deliveries. Use a public https address that reaches this server.",
  TIMED_OUT: "That took too long. Check whether it went through before trying again.",
  PLATFORM_ERROR: "The platform could not be reached. Try again in a minute.",
};

// A failure as this app answers it: the status, the plain words its user
// sees, extra fields for the page (such as the SDK's code), and what only the
// server log should say.
type ErrorAnswer = {
  status: number;
  message: string;
  extra: Record<string, string | null>;
  log: string | null;
};

const answer = (status: number, message: string, extra: Record<string, string | null> = {}, log: string | null = null): ErrorAnswer => ({ status, message, extra, log });

const isKnownCode = (code: string): code is SdkErrorCode => code in MESSAGE_BY_CODE;

// A refusal for a feature that is off names it in details.feature, so the page
// can hide that feature rather than show the same refusal again.
const featureOf = (error: SdkError): string | null => (typeof error.details.feature === "string" ? error.details.feature : null);

const plainMessageOf = (error: SdkError): string | null => (isKnownCode(error.code) ? (MESSAGE_BY_CODE[error.code] ?? null) : null);

const statusOf = (error: SdkError, fallback: number): number => (error.status !== null && error.status >= 400 && error.status < 500 ? error.status : fallback);

// Every SDK failure is an error class you can catch by name. This is where the
// app turns each one into words its user can act on: a code with plain words
// of its own is answered with them, any other by its class. The user only
// ever sees your product's words; the details go to the server log.
const errorAnswerOf = (error: unknown): ErrorAnswer => {
  if (error instanceof ZodError) return answer(400, error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; "));
  if (error instanceof SignInRequiredError) return answer(401, error.message);
  if (error instanceof SdkWebhookSignatureError) return answer(400, "The signature did not check out.", { code: error.code }, `Refused a webhook: ${error.reason}`);
  // A key that is missing, unknown or cancelled is this app's setup, not the user's doing.
  if (error instanceof SdkAuthError && error.status !== 403) {
    return answer(503, "Integrations are not set up on this server yet.", { code: error.code }, `The SDK key was refused (${error.code}). Check APPNIGMA_SDK_KEY in .env.`);
  }
  if (error instanceof SdkError) {
    const plain = plainMessageOf(error);
    const extra = { code: error.code, feature: featureOf(error) };
    if (plain && error.status !== null && error.status < 500) return answer(statusOf(error, 409), plain, extra);
    if (error instanceof SdkAuthError) return answer(403, "This is not switched on for your account yet.", extra);
  }
  if (error instanceof SdkReconnectError) return answer(409, "This connection stopped working. Connect it again.", { code: error.code });
  if (error instanceof SdkNotFoundError) return answer(404, "That is not connected yet.", { code: error.code });
  if (error instanceof SdkNotAvailableError) return answer(409, "That cannot be done right now.", { code: error.code });
  if (error instanceof SdkRetiredError) return answer(410, "That is no longer available.", { code: error.code });
  if (error instanceof SdkInputError) {
    const reason = typeof error.details.reason === "string" ? ` (${error.details.reason})` : "";
    return answer(400, (error.problems.map((problem) => problem.problem.replace(/\.?$/, ".")).join(" ") || "Check what was entered and try again.") + reason, { code: error.code });
  }
  if (error instanceof SdkLogicFailedError) return answer(422, `An automation stopped this: ${error.message}`, { code: error.code });
  if (error instanceof SdkPlatformRefusedError) return answer(422, `The platform said no: ${error.message}`, { code: error.code });
  if (error instanceof SdkRateLimitError) {
    const wait = error.retryAfterSeconds ? ` Try again in ${error.retryAfterSeconds} seconds.` : " Try again in a moment.";
    return answer(429, `Too many requests just now.${wait}`, { code: error.code });
  }
  if (error instanceof SdkNetworkError) return answer(502, "Your integrations can't be reached right now. Try again in a minute.", { code: error.code }, `SDK network error: ${error.message}`);
  if (error instanceof SdkServerError || error instanceof SdkError) {
    // Quote the request id to support; never include the key.
    const log = `SDK ${error.code} (request ${error.requestId ?? "none"}) for ${currentEndCustomerId() ?? "nobody"}: ${error.message}`;
    return answer(502, plainMessageOf(error) ?? "Your integrations had a problem. Try again in a minute.", { code: error.code, requestId: error.requestId }, log);
  }
  return answer(500, "Something went wrong.", {}, error instanceof Error ? (error.stack ?? error.message) : String(error));
};

const respondWithError = (response: Response, error: unknown): void => {
  const { status, message, extra, log } = errorAnswerOf(error);
  if (log) console.error(log);
  response.status(status).json({ error: { message, ...extra } });
};

// Every route runs through this: its user gets plain words, the server log gets the details.
const route =
  (handler: (request: Request, response: Response) => Promise<void>): RequestHandler =>
  async (request, response) => {
    try {
      await handler(request, response);
    } catch (error) {
      respondWithError(response, error);
    }
  };

export { errorAnswerOf, route };
