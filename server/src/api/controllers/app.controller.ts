import type { Request, Response } from "express";
import { ACCOUNT_COOKIE, COOKIE_MAX_AGE_MS } from "../../constants/accounts.js";
import { currentContext } from "../../lib/request-context.js";
import { signInSchema } from "../../schemas/request.schemas.js";
import { appInfo, isAccount, sdkActivity } from "../../services/app.service.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

const appInfoController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await appInfo(currentContext()?.endCustomerId ?? null));
  } catch (error) {
    respondWithError(response, error);
  }
};

// A stand-in for your own login: pick which company you are signed in as.
const signInController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { account } = signInSchema.parse(request.body);
    if (!isAccount(account)) {
      response.status(400).json({ error: { message: "That account does not exist" } });
      return;
    }
    response.cookie(ACCOUNT_COOKIE, account, { httpOnly: true, sameSite: "lax", maxAge: COOKIE_MAX_AGE_MS });
    response.json({ signedInAs: account });
  } catch (error) {
    respondWithError(response, error);
  }
};

const signOutController = async (_request: Request, response: Response): Promise<void> => {
  response.clearCookie(ACCOUNT_COOKIE);
  response.json({ signedInAs: null });
};

const underTheHoodController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json({ calls: sdkActivity(signedInSession().endCustomerId) });
  } catch (error) {
    respondWithError(response, error);
  }
};

export { appInfoController, signInController, signOutController, underTheHoodController };
