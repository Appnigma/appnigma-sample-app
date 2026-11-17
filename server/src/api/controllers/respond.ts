import {
  SdkAuthError,
  SdkError,
  SdkInputError,
  SdkNetworkError,
  SdkNotAvailableError,
  SdkNotFoundError,
  SdkPlatformRefusedError,
  SdkRateLimitError,
  SdkReconnectError,
} from "@appnigma/sdk";
import type { Response } from "express";
import { ZodError } from "zod";
import { currentContext } from "../../lib/request-context.js";
import { FeatureUnavailableError, SignInRequiredError } from "../../lib/errors.js";

const fail = (response: Response, status: number, message: string, extra: Record<string, string | null> = {}): void => {
  response.status(status).json({ error: { message, ...extra } });
};

// Every SDK failure is an error class you can catch by name. This is where the
// app turns each one into something its user can act on.
const respondWithError = (response: Response, error: unknown): void => {
  if (error instanceof ZodError) return fail(response, 400, error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; "));
  if (error instanceof SignInRequiredError) return fail(response, 401, error.message);
  if (error instanceof FeatureUnavailableError) return fail(response, 501, error.message);
  if (error instanceof SdkReconnectError) return fail(response, 409, "This connection stopped working. Connect it again.", { code: error.code });
  if (error instanceof SdkNotFoundError) return fail(response, 404, "That is not connected yet.", { code: error.code });
  if (error instanceof SdkNotAvailableError) return fail(response, 409, "That data is not available for this platform yet.", { code: error.code });
  if (error instanceof SdkAuthError && error.code === "PLATFORM_NOT_ENABLED") return fail(response, 403, "That integration is not available yet.", { code: error.code });
  // A 403 is a feature not switched on for your company; anything else here is the key itself.
  if (error instanceof SdkAuthError && error.status === 403) {
    console.warn(`Appnigma refused with ${error.code}: ${error.message}`);
    return fail(response, 403, "This is not switched on for your account yet.", { code: error.code });
  }
  if (error instanceof SdkAuthError) return fail(response, 503, "Appnigma did not accept this app's SDK key. Check APPNIGMA_SDK_KEY in .env.", { code: error.code });
  if (error instanceof SdkInputError) return fail(response, 400, error.problems.map((problem) => `${problem.field} ${problem.problem}`).join("; ") || error.message, { code: error.code });
  if (error instanceof SdkPlatformRefusedError) return fail(response, 422, `The platform said no: ${error.message}`, { code: error.code });
  if (error instanceof SdkRateLimitError) return fail(response, 429, "Too many requests just now. Try again in a moment.", { code: error.code });
  if (error instanceof SdkNetworkError) return fail(response, 502, `Could not reach the integrations service: ${error.message}`, { code: error.code });
  if (error instanceof SdkError) {
    // Quote the request id to support@appnigma.ai; never include the key.
    console.error(`Appnigma ${error.code} (request ${error.requestId ?? "none"}) for ${currentContext()?.endCustomerId ?? "nobody"}: ${error.message}`);
    return fail(response, 502, "The integrations service had a problem.", { code: error.code, requestId: error.requestId });
  }
  console.error(error);
  fail(response, 500, "Something went wrong.");
};

export { respondWithError };
