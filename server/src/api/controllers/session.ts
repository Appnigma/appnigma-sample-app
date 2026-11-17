import { SignInRequiredError } from "../../lib/errors.js";
import { currentContext } from "../../lib/request-context.js";
import type { SignedInSession } from "../../types/session.types.js";

const signedInSession = (): SignedInSession => {
  const context = currentContext();
  if (!context?.endCustomerId) throw new SignInRequiredError();
  return { endCustomerId: context.endCustomerId };
};

export { signedInSession };
