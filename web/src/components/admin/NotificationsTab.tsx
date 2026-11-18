import type { ClientEventType } from "@appnigma/sdk";
import type { NotificationSettings } from "@server-types/notification.types";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, messageOf } from "../../api/client";
import { EVENT_LABELS, eventSummaryOf } from "../../lib/events";
import { timeAgo } from "../../lib/format";
import { Notice } from "../Notice";
import { Skeleton } from "../Skeleton";

// Where this server is told what happened (webhooks), which events are sent
// (alerts), whether changes in workspaces' accounts are noticed (sync), and
// what arrived here, each checked with verifyWebhook.
const NotificationsTab = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [url, setUrl] = useState("");
  const [chosen, setChosen] = useState<ClientEventType[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const read = await api.notifications();
      setSettings(read);
      setChosen(read.alertEvents);
      setUrl((current) => current || read.receiverUrl);
    } catch (failure) {
      setMessage(messageOf(failure));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (step: () => Promise<void>) => {
    setMessage(null);
    try {
      await step();
      await load();
    } catch (failure) {
      setMessage(messageOf(failure));
    }
  };

  const addWebhook = (event: FormEvent) => {
    event.preventDefault();
    void act(async () => {
      setSecret((await api.addWebhook(url)).secret);
    });
  };

  const toggle = (type: ClientEventType) => setChosen(chosen.includes(type) ? chosen.filter((candidate) => candidate !== type) : [...chosen, type]);

  if (!settings) return message ? <Notice tone="bad">{message}</Notice> : <Skeleton className="h-60" />;

  return (
    <div className="space-y-6">
      {message && <Notice tone="bad">{message}</Notice>}

      <section className="panel space-y-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Notice changes in workspaces' accounts</h2>
            <p className="text-slate-500">
              Every few minutes, changes in each connected account are read and sent to your webhooks as records.changed. This app also reads them itself in the
              background, to keep its own copy of each workspace's records up to date.
              {settings.sync.platforms.length > 0 ? ` Covers ${settings.sync.platforms.join(", ")}.` : ""}
            </p>
          </div>
          <button type="button" onClick={() => void act(async () => {
              await api.switchSync(!settings.sync.on);
            })} className={settings.sync.on ? "button-secondary" : "button-primary"}>
            {settings.sync.on ? "Switch off" : "Switch on"}
          </button>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="section-title">Webhooks</h2>
        {secret && (
          <Notice tone="waiting">
            <p className="font-medium">Keep this secret now: it is shown once.</p>
            <p className="mt-1 break-all font-mono text-xs">{secret}</p>
            <p className="mt-1 text-xs">Put it in .env as APPNIGMA_WEBHOOK_SECRET so this server can still check deliveries after a restart.</p>
          </Notice>
        )}
        {!settings.secretKept && settings.webhooks.length > 0 && !secret && <Notice tone="bad">This server has no webhook secret, so it refuses every delivery. Set APPNIGMA_WEBHOOK_SECRET in .env.</Notice>}
        <ul className="divide-y divide-slate-100">
          {settings.webhooks.map((webhook) => (
            <li key={webhook.webhookId} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{webhook.url}</span>
              <span className={`text-xs font-medium ${webhook.state === "active" ? "text-emerald-700" : "text-rose-700"}`}>
                {webhook.state === "active" ? (webhook.failingSince ? `Failing since ${timeAgo(webhook.failingSince)}` : "Active") : "Switched off after failing for 3 days"}
              </span>
              <span className="text-xs text-slate-500">{webhook.lastDeliveredAt ? `Last delivery ${timeAgo(webhook.lastDeliveredAt)}` : "Nothing delivered yet"}</span>
              <button type="button" onClick={() => void act(async () => {
                  await api.removeWebhook(webhook.webhookId);
                })} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
                Delete
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addWebhook} className="flex flex-wrap gap-2">
          <input className="input flex-1" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} />
          <button type="submit" className="button-primary">
            Add webhook
          </button>
        </form>
        <p className="text-xs text-slate-500">This server takes deliveries at {settings.receiverUrl}. It has to be a public https address.</p>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="section-title">Which events are sent</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {settings.eventTypes.map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input type="checkbox" checked={chosen.includes(type)} onChange={() => toggle(type)} />
              {EVENT_LABELS[type]}
            </label>
          ))}
        </div>
        <button type="button" onClick={() => void act(async () => {
            await api.chooseAlerts(chosen);
          })} className="button-secondary">
          Save
        </button>
      </section>

      <section className="panel">
        <h2 className="section-title border-b border-slate-100 px-5 py-4">Received here</h2>
        {settings.received.length === 0 ? (
          <p className="px-5 py-6 text-slate-500">Nothing has arrived since this server started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {settings.received.map(({ receivedAt, event }) => (
              <li key={event.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-48 shrink-0 font-medium">{EVENT_LABELS[event.type]}</span>
                <span className="min-w-0 flex-1 truncate text-slate-600">{eventSummaryOf(event)}</span>
                <span className="text-xs text-slate-500">{timeAgo(receivedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export { NotificationsTab };
