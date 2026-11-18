import type { SyncHealth } from "@appnigma/sdk";
import type { PlainStatus } from "../types/ui.types";
import { timeAgo } from "./format";

// How this connection's change checks are going, in a few words.
const syncStatusOf = (sync: SyncHealth | null): PlainStatus => {
  if (!sync) return { label: "Not checked for changes yet", tone: "quiet" };
  if (sync.lastFailedAt && !sync.recovered) return { label: `Checking for changes failed ${timeAgo(sync.lastFailedAt)}`, tone: "bad" };
  if (sync.lastFailedAt) return { label: `Checked ${timeAgo(sync.lastCheckedAt)}, back to normal after a failed check`, tone: "good" };
  return { label: `Checked for changes ${timeAgo(sync.lastCheckedAt)}`, tone: "good" };
};

export { syncStatusOf };
