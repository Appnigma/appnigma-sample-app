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
import { ZodError } from "zod";
import { MESSAGE_BY_CODE } from "../constants/error-messages.js";
import type { ErrorAnswer } from "../types/error.types.js";
import { FeatureUnavailableError, SignInRequiredError } from "./errors.js";
import { currentContext } from "./request-context.js";

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
  if (error instanceof FeatureUnavailableError) return answer(501, error.message);
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
    return answer(400, (error.problems.map((problem) => `${problem.field} ${problem.problem}`).join("; ") || "Check what was entered and try again.") + reason, { code: error.code });
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
    const log = `SDK ${error.code} (request ${error.requestId ?? "none"}) for ${currentContext()?.endCustomerId ?? "nobody"}: ${error.message}`;
    return answer(502, plainMessageOf(error) ?? "Your integrations had a problem. Try again in a minute.", { code: error.code, requestId: error.requestId }, log);
  }
  return answer(500, "Something went wrong.", {}, error instanceof Error ? (error.stack ?? error.message) : String(error));
};

export { errorAnswerOf };
