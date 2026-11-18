import { RECORD_SYNC_INTERVAL_MS } from "../constants/changes.js";
import { syncRecordCopies } from "../services/changes.service.js";

// The background job that keeps this app's copy of its customers' records
// fresh. Each run is this job's boundary, as a controller is a request's: a
// failed run is logged and the next one tries again. A run still going when
// the next is due is left to finish.
let running = false;

const runRecordSync = async (): Promise<void> => {
  if (running) return;
  running = true;
  try {
    const tally = await syncRecordCopies();
    if (tally.changes > 0 || tally.failed > 0) console.log(`Record sync: ${tally.changes} changes from ${tally.scopes} reads, ${tally.failed} failed`);
  } catch (error) {
    console.warn(`Record sync didn't run: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    running = false;
  }
};

const startRecordSync = (): void => {
  void runRecordSync();
  setInterval(() => void runRecordSync(), RECORD_SYNC_INTERVAL_MS);
};

export { startRecordSync };
