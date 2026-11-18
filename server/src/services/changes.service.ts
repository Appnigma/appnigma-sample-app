import { SDK_OBJECTS } from "@appnigma/sdk";
import type { CrmCompany, CrmContact, CrmDeal, RecordChange, RecordsChangedEventData } from "@appnigma/sdk";
import { SAMPLE_ACCOUNTS } from "../constants/accounts.js";
import { CHANGES_FEED_LIMIT, RECORD_SYNC_CONNECTIONS_PAGE_SIZE, RECORD_SYNC_FIRST_READ_MS, RECORD_SYNC_PAGE_SIZE } from "../constants/changes.js";
import { appnigma } from "../lib/appnigma.js";
import { copiedChangesOf, keepChanges, markRead, readUpToOf } from "../lib/record-copy.js";
import type { RecentChange, RecentChanges, RecordCopyScope, RecordSyncTally } from "../types/change.types.js";

const contactChange = (change: RecordChange<CrmContact>): RecentChange => ({
  object: "contact",
  recordId: change.recordId,
  name: change.record.fullName ?? change.record.emails[0]?.value ?? "A contact",
  updatedAt: change.updatedAt,
});

const companyChange = (change: RecordChange<CrmCompany>): RecentChange => ({
  object: "company",
  recordId: change.recordId,
  name: change.record.name ?? "A company",
  updatedAt: change.updatedAt,
});

const dealChange = (change: RecordChange<CrmDeal>): RecentChange => ({
  object: "deal",
  recordId: change.recordId,
  name: change.record.name ?? "A deal",
  updatedAt: change.updatedAt,
});

// One page of changes for one scope, in this app's own shape.
const changesPage = async (scope: RecordCopyScope, since: string, cursor: string | undefined): Promise<{ changes: RecentChange[]; nextCursor: string | null }> => {
  const page = { endCustomerId: scope.endCustomerId, platform: scope.platform, since, cursor, limit: RECORD_SYNC_PAGE_SIZE };
  if (scope.object === "contact") {
    const answer = await appnigma.records.changes({ ...page, object: "contact" });
    return { changes: answer.changes.map(contactChange), nextCursor: answer.nextCursor };
  }
  if (scope.object === "company") {
    const answer = await appnigma.records.changes({ ...page, object: "company" });
    return { changes: answer.changes.map(companyChange), nextCursor: answer.nextCursor };
  }
  const answer = await appnigma.records.changes({ ...page, object: "deal" });
  return { changes: answer.changes.map(dealChange), nextCursor: answer.nextCursor };
};

const newestOf = (changes: RecentChange[], since: string): string => changes.reduce((newest, change) => (change.updatedAt > newest ? change.updatedAt : newest), since);

// Reads one scope from where the last read stopped, every page to the end,
// then remembers where this one stopped.
const readScope = async (scope: RecordCopyScope): Promise<number> => {
  const since = readUpToOf(scope) ?? new Date(Date.now() - RECORD_SYNC_FIRST_READ_MS).toISOString();
  let readUpTo = since;
  let cursor: string | undefined;
  let count = 0;
  do {
    const page = await changesPage(scope, since, cursor);
    keepChanges(scope, page.changes);
    readUpTo = newestOf(page.changes, readUpTo);
    count += page.changes.length;
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  markRead(scope, readUpTo);
  return count;
};

const scopesOf = (endCustomerId: string, platform: string): RecordCopyScope[] => SDK_OBJECTS.map((object) => ({ endCustomerId, platform, object }));

// Every connected account of this app's customers, on a platform the sync covers.
const connectedScopes = async (platforms: string[]): Promise<RecordCopyScope[]> => {
  const scopes: RecordCopyScope[] = [];
  let cursor: string | undefined;
  do {
    const page = await appnigma.connections.list({ status: "connected", limit: RECORD_SYNC_CONNECTIONS_PAGE_SIZE, cursor });
    for (const endCustomer of page.endCustomers) {
      if (!SAMPLE_ACCOUNTS.includes(endCustomer.endCustomerId)) continue;
      for (const connection of endCustomer.connections) {
        if (connection.status === "connected" && platforms.includes(connection.platform)) scopes.push(...scopesOf(endCustomer.endCustomerId, connection.platform));
      }
    }
    cursor = page.next ?? undefined;
  } while (cursor);
  return scopes;
};

// The background job's work: while the sync is on, read every connected
// account's changes into this app's copy. One scope failing doesn't stop the others.
const syncRecordCopies = async (): Promise<RecordSyncTally> => {
  const sync = await appnigma.sync.get();
  if (!sync.on || sync.platforms.length === 0) return { scopes: 0, changes: 0, failed: 0 };
  const scopes = await connectedScopes(sync.platforms);
  const reads = await Promise.allSettled(scopes.map(readScope));
  const changes = reads.reduce((total, read) => total + (read.status === "fulfilled" ? read.value : 0), 0);
  return { scopes: scopes.length, changes, failed: reads.filter((read) => read.status === "rejected").length };
};

// A records.changed webhook: the same changes, pushed as they happen, into the same copy.
const keepPushedChanges = (data: RecordsChangedEventData): void => {
  const scope: RecordCopyScope = { endCustomerId: data.endCustomerId, platform: data.platform, object: data.object };
  if (data.object === "contact") keepChanges(scope, data.changes.map(contactChange));
  else if (data.object === "company") keepChanges(scope, data.changes.map(companyChange));
  else keepChanges(scope, data.changes.map(dealChange));
};

// What changed in this customer's account, from this app's copy. The first
// time an account is looked at, it is read straight away rather than waiting
// for the next background run.
const recentChanges = async (endCustomerId: string, platform: string): Promise<RecentChanges> => {
  const sync = await appnigma.sync.get();
  const available = sync.on && sync.platforms.includes(platform);
  if (available && copiedChangesOf(endCustomerId, platform).lastReadAt === null) await Promise.all(scopesOf(endCustomerId, platform).map(readScope));
  const copy = copiedChangesOf(endCustomerId, platform);
  return { syncOn: sync.on, available, lastReadAt: copy.lastReadAt, changes: copy.changes.slice(0, CHANGES_FEED_LIMIT) };
};

export { keepPushedChanges, recentChanges, syncRecordCopies };
