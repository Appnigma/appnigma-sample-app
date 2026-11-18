// How often the background job reads what changed in each customer's account.
const RECORD_SYNC_INTERVAL_MS = 5 * 60_000;

// A customer's first read goes back this far; every read after starts where the
// last one stopped.
const RECORD_SYNC_FIRST_READ_MS = 7 * 86_400_000;

// Changes asked for per page; the job follows nextCursor to the last page.
const RECORD_SYNC_PAGE_SIZE = 100;

// Connections asked for per page when the job looks for who to read.
const RECORD_SYNC_CONNECTIONS_PAGE_SIZE = 100;

const CHANGES_FEED_LIMIT = 30;

export { CHANGES_FEED_LIMIT, RECORD_SYNC_CONNECTIONS_PAGE_SIZE, RECORD_SYNC_FIRST_READ_MS, RECORD_SYNC_INTERVAL_MS, RECORD_SYNC_PAGE_SIZE };
