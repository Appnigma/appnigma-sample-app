import type { ClientEvent } from "@appnigma/sdk";
import { env } from "../config/env.js";
import { RECEIVED_EVENTS_LIMIT } from "../constants/webhooks.js";
import type { ReceivedEvent } from "../types/notification.types.js";

// Kept in memory so this sample needs no database. Your product would store
// the secret in its secret store and each event's id in its own database.
const createdSecrets = new Map<string, string>();
const received: ReceivedEvent[] = [];

const keepSecret = (webhookId: string, secret: string): void => {
  createdSecrets.set(webhookId, secret);
};

const forgetSecret = (webhookId: string): void => {
  createdSecrets.delete(webhookId);
};

// The secret in .env first; otherwise the newest webhook made since start.
const currentWebhookSecret = (): string => env.webhookSecret ?? [...createdSecrets.values()].at(-1) ?? "";

const isSecretKept = (): boolean => currentWebhookSecret() !== "";

// The same event can arrive twice, so one already kept is dropped.
const keepReceivedEvent = (event: ClientEvent): boolean => {
  if (received.some((kept) => kept.event.id === event.id)) return false;
  received.unshift({ receivedAt: new Date().toISOString(), event });
  received.splice(RECEIVED_EVENTS_LIMIT);
  return true;
};

const receivedEvents = (): ReceivedEvent[] => [...received];

export { currentWebhookSecret, forgetSecret, isSecretKept, keepReceivedEvent, keepSecret, receivedEvents };
