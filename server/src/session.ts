import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

// A stand-in for your own login: pick which company you are signed in as.
// Each company is an "end customer" to Appnigma: its name is the
// endCustomerId every SDK call names.
const ACCOUNTS = ["Brightline Legal", "Cobalt Freight", "Juniper Health"];

const ACCOUNT_COOKIE = "account";

const COOKIE_MAX_AGE_MS = 30 * 86_400_000;

class SignInRequiredError extends Error {
  constructor() {
    super("Sign in first");
    this.name = "SignInRequiredError";
  }
}

// Who is signed in, for the request being served. The "Under the hood" log
// and the error log read it without every function passing it along.
const requestContext = new AsyncLocalStorage<{ endCustomerId: string | null }>();

const parseCookies = (header: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
  }
  return cookies;
};

const withSession: RequestHandler = (request, _response, next) => {
  const endCustomerId = parseCookies(request.headers.cookie)[ACCOUNT_COOKIE] ?? null;
  requestContext.run({ endCustomerId }, next);
};

const currentEndCustomerId = (): string | null => requestContext.getStore()?.endCustomerId ?? null;

const requireSignedIn: RequestHandler = (_request, response, next) => {
  if (currentEndCustomerId()) return next();
  response.status(401).json({ error: { message: "Sign in first" } });
};

// The signed-in workspace: every SDK call a route makes names it as endCustomerId.
const signedInWorkspace = (): string => {
  const endCustomerId = currentEndCustomerId();
  if (!endCustomerId) throw new SignInRequiredError();
  return endCustomerId;
};

export { ACCOUNT_COOKIE, ACCOUNTS, COOKIE_MAX_AGE_MS, currentEndCustomerId, requireSignedIn, signedInWorkspace, SignInRequiredError, withSession };
