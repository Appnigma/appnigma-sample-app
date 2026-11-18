import { env } from "../config/env.js";
import { SAMPLE_ACCOUNTS } from "../constants/accounts.js";
import { CALL_PLATFORM } from "../constants/crm.js";
import { appnigma } from "../lib/appnigma.js";
import { errorAnswerOf } from "../lib/error-answer.js";
import { recentSdkCalls } from "../lib/sdk-call-log.js";
import type { AppInfo, FeaturesOn } from "../types/app.types.js";
import type { SdkCallRecord } from "../types/sdk-call.types.js";
import { isPlatformOn } from "./integrations.service.js";

// Which features are on for your company, so the pages hide what is off: the
// calls of a feature that is off are refused.
const featuresOn = async (): Promise<FeaturesOn> => {
  const { features } = await appnigma.features.list();
  const isOn = (name: string): boolean => features.some((feature) => feature.name === name && feature.enabled);
  return { portal: isOn("portal"), sync: isOn("sync") };
};

const FEATURES_OFF: FeaturesOn = { portal: false, sync: false };

// The Calls page only shows once Gong is switched on for your company. The app
// itself never waits on these: when one can't be read, what it shows stays
// hidden until the next load, and each page reports its own reads.
const appInfo = async (signedInAs: string | null): Promise<AppInfo> => {
  const [calls, features] = await Promise.allSettled([isPlatformOn(CALL_PLATFORM), featuresOn()]);
  for (const read of [calls, features]) if (read.status === "rejected") console.warn(errorAnswerOf(read.reason).log ?? "Couldn't read what is switched on");
  return {
    productName: env.productName,
    brandColor: env.brandColor,
    accounts: SAMPLE_ACCOUNTS,
    signedInAs,
    callsAvailable: calls.status === "fulfilled" ? calls.value : false,
    features: features.status === "fulfilled" ? features.value : FEATURES_OFF,
  };
};

const isAccount = (account: string): boolean => SAMPLE_ACCOUNTS.includes(account);

const sdkActivity = (endCustomerId: string): SdkCallRecord[] => recentSdkCalls(endCustomerId);

export { appInfo, isAccount, sdkActivity };
