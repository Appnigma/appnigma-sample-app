import { ACCOUNT_DETAIL_SOURCES } from "../constants/platform-accounts.js";
import { appnigma } from "../lib/appnigma.js";
import { textAt } from "../lib/json-path.js";
import type { AccountDetail } from "../types/integration.types.js";

const PLATFORM_OK_STATUS = 200;

// Which account this customer connected, read from the platform's own API.
// request() hands back the platform's answer as it gave it, refusals
// included, so the status is checked here rather than caught.
const connectedAccountOf = async (endCustomerId: string, platform: string): Promise<AccountDetail[]> => {
  const source = ACCOUNT_DETAIL_SOURCES[platform];
  if (!source) return [];
  const answer = await appnigma.request({ endCustomerId, platform, method: "GET", path: source.path });
  if (answer.status !== PLATFORM_OK_STATUS) return [];
  return source.fields.flatMap(({ label, field }) => {
    const value = textAt(answer.body, field);
    return value === null ? [] : [{ label, value }];
  });
};

export { connectedAccountOf };
