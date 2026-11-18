import type { ClientEvent, ClientEventType } from "@appnigma/sdk";

const EVENT_LABELS: Record<ClientEventType, string> = {
  "connection.dropped": "A connection dropped",
  "connection.restored": "A connection came back",
  "go_live.finished": "A change went live",
  "go_live.failed": "A change did not go live",
  "logic.failed": "An automation failed",
  "records.changed": "Records changed in an account",
};

// records.changed carries records, so it is never kept and never listed.
const LISTED_EVENT_TYPES: ClientEventType[] = ["connection.dropped", "connection.restored", "go_live.finished", "go_live.failed", "logic.failed"];

// One line about an event. Events carry ids and codes only, never a record's
// contents, except records.changed, which carries the changed records.
const eventSummaryOf = (event: ClientEvent): string => {
  switch (event.type) {
    case "connection.dropped":
      return `${event.data.endCustomerId} on ${event.data.platform} must connect again (${event.data.code})`;
    case "connection.restored":
      return `${event.data.endCustomerId} on ${event.data.platform} is connected again`;
    case "go_live.finished":
      return `Went live as ${event.data.commitSha.slice(0, 7)}`;
    case "go_live.failed":
      return `Did not go live${event.data.code ? ` (${event.data.code})` : ""}`;
    case "logic.failed":
      return `${event.data.logicName} failed for ${event.data.endCustomerId}${event.data.errorCode ? ` (${event.data.errorCode})` : ""}`;
    case "records.changed":
      return `${event.data.changes.length} ${event.data.object} ${event.data.changes.length === 1 ? "change" : "changes"} for ${event.data.endCustomerId} on ${event.data.platform}`;
  }
};

export { EVENT_LABELS, LISTED_EVENT_TYPES, eventSummaryOf };
