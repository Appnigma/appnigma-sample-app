import type { SdkObject } from "@appnigma/sdk";

type RecentChange = {
  object: SdkObject;
  recordId: string;
  name: string;
  updatedAt: string;
};

// What changed in one customer's account, from this app's own copy.
type RecentChanges = {
  // Whether keeping a copy is switched on at all.
  syncOn: boolean;
  // Whether this platform's changes can be copied: on, and the platform can list its changes by time.
  available: boolean;
  // When the background job last read this account, or null before its first read.
  lastReadAt: string | null;
  changes: RecentChange[];
};

// One customer's records of one kind, on one platform: what the background job reads as a unit.
type RecordCopyScope = {
  endCustomerId: string;
  platform: string;
  object: SdkObject;
};

// The copy of one scope: its records by id, and how far the job has read.
type RecordCopy = {
  records: Map<string, RecentChange>;
  readUpTo: string | null;
  lastReadAt: string | null;
};

type RecordSyncTally = {
  scopes: number;
  changes: number;
  failed: number;
};

export type { RecentChange, RecentChanges, RecordCopy, RecordCopyScope, RecordSyncTally };
