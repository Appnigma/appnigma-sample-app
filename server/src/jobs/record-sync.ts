import { SDK_OBJECTS } from "@appnigma/sdk";
import type { CrmCompany, CrmContact, CrmDeal, RecordChange, RecordsChangedEventData, SdkObject } from "@appnigma/sdk";
import { appnigma } from "../appnigma.js";
import { ACCOUNTS } from "../session.js";
import type { RecentChange, RecentChanges } from "../types.js";

// This app's own copy of its customers' records, kept fresh two ways: a
// background job reads what changed with records.changes, and records.changed
// webhooks push the same changes as they happen. Kept in memory so this
// sample needs no database: your product would keep the records, and how far
// it has read, in its own database.

// How often the job reads what changed in each customer's account.
const SYNC_INTERVAL_MS = 5 * 60_000;
// A customer's first read goes back this far; every read after starts where the last one stopped.
const FIRST_READ_MS = 7 * 86_400_000;
const CHANGES_PAGE_SIZE = 100;
const CONNECTIONS_PAGE_SIZE = 100;
const CHANGES_FEED_LIMIT = 30;

// One customer's records of one kind, on one platform: what the job reads as a unit.
type Scope = { endCustomerId: string; platform: string; object: SdkObject };

// The copy of one scope: its records by id, and how far the job has read.
type Copy = { records: Map<string, RecentChange>; readUpTo: string | null; lastReadAt: string | null };

const copies = new Map<string, Copy>();

const keyOf = (scope: Scope): string => `${scope.endCustomerId}/${scope.platform}/${scope.object}`;

const copyOf = (scope: Scope): Copy => {
  const existing = copies.get(keyOf(scope));
  if (existing) return existing;
  const created: Copy = { records: new Map(), readUpTo: null, lastReadAt: null };
  copies.set(keyOf(scope), created);
  return created;
};

// A change replaces the copy only when it is newer, so a late webhook never undoes a fresher read.
const keepChanges = (scope: Scope, changes: RecentChange[]): void => {
  const copy = copyOf(scope);
  for (const change of changes) {
    const kept = copy.records.get(change.recordId);
    if (!kept || kept.updatedAt <= change.updatedAt) copy.records.set(change.recordId, change);
  }
};

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
const changesPage = async (scope: Scope, since: string, cursor: string | undefined): Promise<{ changes: RecentChange[]; nextCursor: string | null }> => {
  const page = { endCustomerId: scope.endCustomerId, platform: scope.platform, since, cursor, limit: CHANGES_PAGE_SIZE };
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

// Reads one scope from where the last read stopped, every page to the end,
// then remembers where this one stopped: the newest change it saw, or where
// it started when nothing changed.
const readScope = async (scope: Scope): Promise<number> => {
  const since = copies.get(keyOf(scope))?.readUpTo ?? new Date(Date.now() - FIRST_READ_MS).toISOString();
  let readUpTo = since;
  let cursor: string | undefined;
  let count = 0;
  do {
    const page = await changesPage(scope, since, cursor);
    keepChanges(scope, page.changes);
    readUpTo = page.changes.reduce((newest, change) => (change.updatedAt > newest ? change.updatedAt : newest), readUpTo);
    count += page.changes.length;
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  const copy = copyOf(scope);
  copy.readUpTo = readUpTo;
  copy.lastReadAt = new Date().toISOString();
  return count;
};

const scopesOf = (endCustomerId: string, platform: string): Scope[] => SDK_OBJECTS.map((object) => ({ endCustomerId, platform, object }));

// Every connected account of this app's customers, on a platform the sync covers.
const connectedScopes = async (platforms: string[]): Promise<Scope[]> => {
  const scopes: Scope[] = [];
  let cursor: string | undefined;
  do {
    const page = await appnigma.connections.list({ status: "connected", limit: CONNECTIONS_PAGE_SIZE, cursor });
    for (const endCustomer of page.endCustomers) {
      if (!ACCOUNTS.includes(endCustomer.endCustomerId)) continue;
      for (const connection of endCustomer.connections) {
        if (connection.status === "connected" && platforms.includes(connection.platform)) scopes.push(...scopesOf(endCustomer.endCustomerId, connection.platform));
      }
    }
    cursor = page.next ?? undefined;
  } while (cursor);
  return scopes;
};

// One run of the job: while the sync is on, read every connected account's
// changes into the copy. One scope failing doesn't stop the others; a failed
// run is logged and the next one tries again; a run still going when the next
// is due is left to finish.
let running = false;

const runRecordSync = async (): Promise<void> => {
  if (running) return;
  running = true;
  try {
    const sync = await appnigma.sync.get();
    if (!sync.on || sync.platforms.length === 0) return;
    const scopes = await connectedScopes(sync.platforms);
    const reads = await Promise.allSettled(scopes.map(readScope));
    const changes = reads.reduce((total, read) => total + (read.status === "fulfilled" ? read.value : 0), 0);
    const failed = reads.filter((read) => read.status === "rejected").length;
    if (changes > 0 || failed > 0) console.log(`Record sync: ${changes} changes from ${scopes.length} reads, ${failed} failed`);
  } catch (error) {
    console.warn(`Record sync didn't run: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    running = false;
  }
};

const startRecordSync = (): void => {
  void runRecordSync();
  setInterval(() => void runRecordSync(), SYNC_INTERVAL_MS);
};

// A records.changed webhook: the same changes, pushed as they happen, into the same copy.
const keepPushedChanges = (data: RecordsChangedEventData): void => {
  const scope: Scope = { endCustomerId: data.endCustomerId, platform: data.platform, object: data.object };
  if (data.object === "contact") keepChanges(scope, data.changes.map(contactChange));
  else if (data.object === "company") keepChanges(scope, data.changes.map(companyChange));
  else keepChanges(scope, data.changes.map(dealChange));
};

// One customer's copied records on one platform, every kind together, newest first.
const copiedChangesOf = (endCustomerId: string, platform: string): { lastReadAt: string | null; changes: RecentChange[] } => {
  const prefix = `${endCustomerId}/${platform}/`;
  const scoped = [...copies.entries()].filter(([key]) => key.startsWith(prefix)).map(([, copy]) => copy);
  const readTimes = scoped.flatMap((copy) => (copy.lastReadAt ? [copy.lastReadAt] : [])).sort();
  const changes = scoped.flatMap((copy) => [...copy.records.values()]).sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  return { lastReadAt: readTimes.at(-1) ?? null, changes };
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

export { keepPushedChanges, recentChanges, startRecordSync };
