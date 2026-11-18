import { Router } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { env } from "../env.js";
import { errorAnswerOf, route } from "../errors.js";
import { ACCOUNT_COOKIE, ACCOUNTS, COOKIE_MAX_AGE_MS, currentEndCustomerId } from "../session.js";
import type { AppInfo, FeaturesOn } from "../types.js";
import { CALL_PLATFORM } from "./calls.js";
import { isPlatformOn } from "./integrations.js";

// The app shell: the product's name and colour, who is signed in, and which
// features are on for your company, so the pages hide what is off: the calls
// of a feature that is off are refused.

const FEATURES_OFF: FeaturesOn = { portal: false, sync: false };

const featuresOn = async (): Promise<FeaturesOn> => {
  const { features } = await appnigma.features.list();
  const isOn = (name: string): boolean => features.some((feature) => feature.name === name && feature.enabled);
  return { portal: isOn("portal"), sync: isOn("sync") };
};

const appRouter = Router();

// The Calls page only shows once Gong is switched on for your company. The app
// itself never waits on these: when one can't be read, what it shows stays
// hidden until the next load, and each page reports its own reads.
appRouter.get(
  "/",
  route(async (_request, response) => {
    const [calls, features] = await Promise.allSettled([isPlatformOn(CALL_PLATFORM), featuresOn()]);
    for (const read of [calls, features]) if (read.status === "rejected") console.warn(errorAnswerOf(read.reason).log ?? "Couldn't read what is switched on");
    const info: AppInfo = {
      productName: env.productName,
      brandColor: env.brandColor,
      accounts: ACCOUNTS,
      signedInAs: currentEndCustomerId(),
      callsAvailable: calls.status === "fulfilled" ? calls.value : false,
      features: features.status === "fulfilled" ? features.value : FEATURES_OFF,
    };
    response.json(info);
  }),
);

// A stand-in for your own login: pick which company you are signed in as.
appRouter.post(
  "/session",
  route(async (request, response) => {
    const { account } = z.object({ account: z.string().trim().min(1).max(255) }).parse(request.body);
    if (!ACCOUNTS.includes(account)) {
      response.status(400).json({ error: { message: "That account does not exist" } });
      return;
    }
    response.cookie(ACCOUNT_COOKIE, account, { httpOnly: true, sameSite: "lax", maxAge: COOKIE_MAX_AGE_MS });
    response.json({ signedInAs: account });
  }),
);

appRouter.delete(
  "/session",
  route(async (_request, response) => {
    response.clearCookie(ACCOUNT_COOKIE);
    response.json({ signedInAs: null });
  }),
);

export { appRouter };
