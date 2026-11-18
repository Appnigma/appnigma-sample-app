import type { ClientEventType, ListedClientEvent } from "@appnigma/sdk";
import { useCallback, useEffect, useState } from "react";
import { api, messageOf } from "../../api/client";
import { EVENT_LABELS, LISTED_EVENT_TYPES, eventSummaryOf } from "../../lib/events";
import { timeAgo } from "../../lib/format";
import { Notice } from "../Notice";

// The last 30 days of events, newest first, with how each went at every webhook.
const EventsTab = () => {
  const [type, setType] = useState<ClientEventType | undefined>(undefined);
  const [events, setEvents] = useState<ListedClientEvent[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string) => {
      try {
        const page = await api.eventLog(type, cursor);
        setEvents((current) => (cursor && current ? [...current, ...page.events] : page.events));
        setNext(page.nextCursor);
      } catch (failure) {
        setError(messageOf(failure));
      }
    },
    [type],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <select className="input w-auto" value={type ?? ""} onChange={(event) => setType(LISTED_EVENT_TYPES.find((candidate) => candidate === event.target.value))}>
        <option value="">Every event</option>
        {LISTED_EVENT_TYPES.map((candidate) => (
          <option key={candidate} value={candidate}>
            {EVENT_LABELS[candidate]}
          </option>
        ))}
      </select>
      {error && <Notice tone="bad">{error}</Notice>}
      {events && events.length === 0 && <p className="text-slate-500">Nothing happened in the last 30 days.</p>}
      {events && events.length > 0 && (
        <ul className="panel divide-y divide-slate-100">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="w-48 shrink-0 font-medium">{EVENT_LABELS[event.type]}</span>
              <span className="min-w-0 flex-1 truncate text-slate-600">{eventSummaryOf(event)}</span>
              <span className="text-xs text-slate-500">{event.deliveries.length === 0 ? "Not sent" : event.deliveries.map((delivery) => delivery.state).join(", ")}</span>
              <span className="text-xs text-slate-500">{timeAgo(event.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      {next && (
        <button type="button" onClick={() => void load(next)} className="button-secondary">
          Load more
        </button>
      )}
    </div>
  );
};

export { EventsTab };
