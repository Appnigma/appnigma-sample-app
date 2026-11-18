import type { SdkErrorCode } from "@appnigma/sdk";

// What a user is told for each refusal code, in plain words. A code missing
// here falls back to the message for its error class in respond.ts.
const MESSAGE_BY_CODE: Partial<Record<SdkErrorCode, string>> = {
  PLATFORM_NOT_ENABLED: "That integration is not available yet.",
  PORTAL_NOT_ENABLED: "Automations are not switched on for your account yet.",
  SYNC_NOT_ENABLED: "Noticing changes is not switched on for your account yet.",
  PORTAL_NOT_AVAILABLE: "The automation editor is not available for your account right now.",
  END_CUSTOMER_LOGIC_NOT_AVAILABLE: "Changing automations is not available for your workspace right now. You can still read and try them.",
  REPO_ACCESS_REFUSED: "Automations cannot go live right now. Our team has been told.",
  MISSING_SCOPES: "This connection is missing a permission it needs. Connect it again and approve everything it asks for.",
  END_CUSTOMER_NOT_FOUND: "That is not connected yet.",
  RECORD_NOT_FOUND: "That record no longer exists.",
  ACTION_NOT_FOUND: "That action is not available for this integration.",
  FUNCTION_NOT_FOUND: "That function does not exist.",
  LOGIC_NOT_FOUND: "That automation no longer exists.",
  WEBHOOK_NOT_FOUND: "That webhook no longer exists.",
  FUNCTION_RETIRED: "That function was removed and will not answer again.",
  DATA_TYPE_NOT_AVAILABLE: "That data is not available for this platform yet.",
  DRAFT_CHANGED: "This automation changed since you opened it. Reload to see the latest, then try again.",
  LOGIC_NAME_TAKEN: "An automation with that name already exists. Pick another name.",
  TOO_MANY_DRAFTS: "You have too many unfinished automations. Put one live or throw one away first.",
  PLATFORM_NOT_CONNECTED: "Connect that integration first.",
  NOTHING_TO_GO_LIVE: "There is no change to put live.",
  FILE_CHANGED: "Someone put a newer version live since this change began. Reload and make the change again.",
  SETTINGS_MISSING: "This automation needs settings you have not set yet.",
  LOGIC_NOT_ALWAYS_ON: "This automation only runs when it is called, so it has no on and off switch.",
  LOGIC_CHECK_FAILED: "This change does not pass the checks yet. Ask for a fix, then try again.",
  CONNECT_LOGIN_REJECTED: "Those details were not accepted. Check them and try again.",
  CONNECT_KEY_CHANGED: "That did not go through. Send it again.",
  WEBHOOK_LIMIT_REACHED: "You already have five webhooks. Delete one first.",
  WEBHOOK_EXISTS: "There is already a webhook at that address.",
  WEBHOOK_ADDRESS_REFUSED: "That address can't take deliveries. Use a public https address that reaches this server.",
  TIMED_OUT: "That took too long. Check whether it went through before trying again.",
  PLATFORM_ERROR: "The platform could not be reached. Try again in a minute.",
};

export { MESSAGE_BY_CODE };
