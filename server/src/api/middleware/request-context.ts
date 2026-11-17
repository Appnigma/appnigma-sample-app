import type { RequestHandler } from "express";
import { ACCOUNT_COOKIE } from "../../constants/accounts.js";
import { parseCookies } from "../../lib/cookies.js";
import { currentContext, requestContext } from "../../lib/request-context.js";

// Runs the rest of the request with who is signed in: a stand-in for your own login.
const withRequestContext: RequestHandler = (request, _response, next) => {
  const endCustomerId = parseCookies(request.headers.cookie)[ACCOUNT_COOKIE] ?? null;
  requestContext.run({ endCustomerId }, next);
};

const requireSignedIn: RequestHandler = (_request, response, next) => {
  if (currentContext()?.endCustomerId) return next();
  response.status(401).json({ error: { message: "Sign in first" } });
};

export { requireSignedIn, withRequestContext };
