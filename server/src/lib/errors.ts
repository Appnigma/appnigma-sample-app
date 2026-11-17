// Refusals that come from this app rather than from Appnigma.
class SignInRequiredError extends Error {
  constructor() {
    super("Sign in first");
    this.name = "SignInRequiredError";
  }
}

class FeatureUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureUnavailableError";
  }
}

export { FeatureUnavailableError, SignInRequiredError };
