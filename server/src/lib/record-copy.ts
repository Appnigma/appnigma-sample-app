import type { RecentChange, RecordCopy, RecordCopyScope } from "../types/change.types.js";

// This app's own copy of its customers' records, kept fresh by the background
// job and by records.changed webhooks. Kept in memory so this sample needs no
// database: your product would keep the records, and how far it has read, in
// its own database.
const copies = new Map<string, RecordCopy>();

const keyOf = (scope: RecordCopyScope): string => `${scope.endCustomerId}/${scope.platform}/${scope.object}`;

const copyOf = (scope: RecordCopyScope): RecordCopy => {
  const existing = copies.get(keyOf(scope));
  if (existing) return existing;
  const created: RecordCopy = { records: new Map(), readUpTo: null, lastReadAt: null };
  copies.set(keyOf(scope), created);
  return created;
};

const readUpToOf = (scope: RecordCopyScope): string | null => copies.get(keyOf(scope))?.readUpTo ?? null;

// A change replaces the copy only when it is newer, so a late webhook never
// undoes a fresher read.
const keepChanges = (scope: RecordCopyScope, changes: RecentChange[]): void => {
  const copy = copyOf(scope);
  for (const change of changes) {
    const kept = copy.records.get(change.recordId);
    if (!kept || kept.updatedAt <= change.updatedAt) copy.records.set(change.recordId, change);
  }
};

// Where the next read starts: the newest change this one saw, or where it started when nothing changed.
const markRead = (scope: RecordCopyScope, readUpTo: string): void => {
  const copy = copyOf(scope);
  copy.readUpTo = readUpTo;
  copy.lastReadAt = new Date().toISOString();
};

// One customer's copied records on one platform, every kind together, newest first.
const copiedChangesOf = (endCustomerId: string, platform: string): { lastReadAt: string | null; changes: RecentChange[] } => {
  const prefix = `${endCustomerId}/${platform}/`;
  const scoped = [...copies.entries()].filter(([key]) => key.startsWith(prefix)).map(([, copy]) => copy);
  const readTimes = scoped.flatMap((copy) => (copy.lastReadAt ? [copy.lastReadAt] : [])).sort();
  const changes = scoped.flatMap((copy) => [...copy.records.values()]).sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  return { lastReadAt: readTimes.at(-1) ?? null, changes };
};

export { copiedChangesOf, keepChanges, markRead, readUpToOf };
