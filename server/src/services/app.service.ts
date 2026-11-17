import { env } from "../config/env.js";
import { SAMPLE_ACCOUNTS } from "../constants/accounts.js";
import { CALL_PLATFORM } from "../constants/crm.js";
import { recentSdkCalls } from "../lib/sdk-call-log.js";
import type { AppInfo } from "../types/app.types.js";
import type { SdkCallRecord } from "../types/sdk-call.types.js";
import { isPlatformOn } from "./integrations.service.js";

// The Calls page only shows once Gong is switched on for your company.
const appInfo = async (signedInAs: string | null): Promise<AppInfo> => ({
  productName: env.productName,
  brandColor: env.brandColor,
  accounts: SAMPLE_ACCOUNTS,
  signedInAs,
  callsAvailable: await isPlatformOn(CALL_PLATFORM),
});

const isAccount = (account: string): boolean => SAMPLE_ACCOUNTS.includes(account);

const sdkActivity = (endCustomerId: string): SdkCallRecord[] => recentSdkCalls(endCustomerId);

export { appInfo, isAccount, sdkActivity };
