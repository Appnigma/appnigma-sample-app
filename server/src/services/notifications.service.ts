import { CLIENT_EVENT_TYPES, verifyWebhook } from "@appnigma/sdk";
import type { ClientEvent, ClientEventType, SyncSettings } from "@appnigma/sdk";
import { env } from "../config/env.js";
import { EVENTS_PAGE_SIZE, WEBHOOK_RECEIVER_PATH } from "../constants/webhooks.js";
import { appnigma } from "../lib/appnigma.js";
import { currentWebhookSecret, forgetSecret, isSecretKept, keepReceivedEvent, keepSecret, receivedEvents } from "../lib/webhook-inbox.js";
import type { CreatedWebhook, EventLogPage, NotificationSettings } from "../types/notification.types.js";
import { keepPushedChanges } from "./changes.service.js";

// Where this server is told what happened, which events are sent there, and
// whether changes in your customers' accounts are noticed at all.
const notificationSettings = async (): Promise<NotificationSettings> => {
  const [{ webhooks }, alerts, sync] = await Promise.all([appnigma.webhooks.list(), appnigma.alerts.get(), appnigma.sync.get()]);
  return {
    receiverUrl: `${env.publicUrl}${WEBHOOK_RECEIVER_PATH}`,
    secretKept: isSecretKept(),
    webhooks,
    eventTypes: [...CLIENT_EVENT_TYPES],
    alertEvents: alerts.events,
    sync,
    received: receivedEvents(),
  };
};

// The secret comes back once, in this answer, and never again.
const addWebhook = async (url: string): Promise<CreatedWebhook> => {
  const { webhook, secret } = await appnigma.webhooks.create({ url });
  keepSecret(webhook.webhookId, secret);
  return { webhook, secret };
};

const removeWebhook = async (webhookId: string): Promise<void> => {
  await appnigma.webhooks.delete({ webhookId });
  forgetSecret(webhookId);
};

// Replaces the list: an empty list sends nothing.
const chooseAlerts = async (events: ClientEventType[]): Promise<ClientEventType[]> => (await appnigma.alerts.set({ events })).events;

const switchSync = async (on: boolean): Promise<SyncSettings> => appnigma.sync.set({ on });

// Every event but records.changed is kept for 30 days, with how it went at each webhook.
const eventLog = async (type?: ClientEventType, cursor?: string): Promise<EventLogPage> => {
  const page = await appnigma.events.list({ type, cursor, limit: EVENTS_PAGE_SIZE });
  return { events: page.events, nextCursor: page.nextCursor };
};

// An event arriving at this server. verifyWebhook checks the signature on the
// body exactly as it arrived, before anything parses it, and throws
// SdkWebhookSignatureError when it is not from Appnigma.
const receiveWebhook = async (body: Uint8Array | string, signature: string | undefined): Promise<ClientEvent> => {
  const event = await verifyWebhook(body, signature, currentWebhookSecret());
  const isNew = keepReceivedEvent(event);
  // Changes in a customer's account go straight into this app's copy of their records.
  if (isNew && event.type === "records.changed") keepPushedChanges(event.data);
  return event;
};

export { addWebhook, chooseAlerts, eventLog, notificationSettings, receiveWebhook, removeWebhook, switchSync };
