import type { ClientEvent, ClientEventType, ListedClientEvent, SyncSettings, Webhook } from "@appnigma/sdk";

type ReceivedEvent = {
  receivedAt: string;
  event: ClientEvent;
};

type NotificationSettings = {
  receiverUrl: string;
  secretKept: boolean;
  webhooks: Webhook[];
  eventTypes: ClientEventType[];
  alertEvents: ClientEventType[];
  sync: SyncSettings;
  received: ReceivedEvent[];
};

type CreatedWebhook = {
  webhook: Webhook;
  secret: string;
};

type EventLogPage = {
  events: ListedClientEvent[];
  nextCursor: string | null;
};

export type { CreatedWebhook, EventLogPage, NotificationSettings, ReceivedEvent };
