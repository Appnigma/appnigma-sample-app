import { CLIENT_EVENT_TYPES, verifyWebhook } from "@appnigma/sdk";
import express, { Router } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { env } from "../env.js";
import { route } from "../errors.js";
import { keepPushedChanges } from "../jobs/record-sync.js";
import { requireSignedIn } from "../session.js";
import type { CreatedWebhook, EventLogPage, NotificationSettings, ReceivedEvent } from "../types.js";

// Hearing what happened: where this server is told (webhooks and the signed
// receiver below), which events are sent there (alerts), what was sent (the
// event log), and whether changes in your customers' accounts are noticed at
// all (sync).

// Where this app's server takes the events Appnigma sends it.
const WEBHOOK_RECEIVER_PATH = "/webhooks/appnigma";
const SIGNATURE_HEADER = "Appnigma-Signature";
const RECEIVED_EVENTS_LIMIT = 50;
const EVENTS_PAGE_SIZE = 20;

// Kept in memory so this sample needs no database. Your product would store
// the secret in its secret store and each event's id in its own database.
const createdSecrets = new Map<string, string>();
const received: ReceivedEvent[] = [];

// The secret in .env first; otherwise the newest webhook made since start.
const currentWebhookSecret = (): string => env.webhookSecret ?? [...createdSecrets.values()].at(-1) ?? "";

const eventLogQuerySchema = z.object({
  type: z.enum(CLIENT_EVENT_TYPES).optional(),
  cursor: z.string().max(500).optional(),
});

// Your team's own settings, across every workspace. In your product these sit
// behind your staff login; this sample only asks for a signed-in workspace.
const notificationsRouter = Router();

notificationsRouter.use(requireSignedIn);

notificationsRouter.get(
  "/notifications",
  route(async (_request, response) => {
    const [{ webhooks }, alerts, sync] = await Promise.all([appnigma.webhooks.list(), appnigma.alerts.get(), appnigma.sync.get()]);
    const settings: NotificationSettings = {
      receiverUrl: `${env.publicUrl}${WEBHOOK_RECEIVER_PATH}`,
      secretKept: currentWebhookSecret() !== "",
      webhooks,
      eventTypes: [...CLIENT_EVENT_TYPES],
      alertEvents: alerts.events,
      sync,
      received: [...received],
    };
    response.json(settings);
  }),
);

// The secret comes back once, in this answer, and never again.
notificationsRouter.post(
  "/webhooks",
  route(async (request, response) => {
    const { url } = z.object({ url: z.url().refine((value) => value.startsWith("https://"), "should be an https address") }).parse(request.body);
    const { webhook, secret } = await appnigma.webhooks.create({ url });
    createdSecrets.set(webhook.webhookId, secret);
    const created: CreatedWebhook = { webhook, secret };
    response.status(201).json(created);
  }),
);

notificationsRouter.delete(
  "/webhooks/:webhookId",
  route(async (request, response) => {
    const webhookId = z.string().trim().min(1).max(100).parse(request.params.webhookId);
    await appnigma.webhooks.delete({ webhookId });
    createdSecrets.delete(webhookId);
    response.json({ deleted: true });
  }),
);

// Replaces the list: an empty list sends nothing.
notificationsRouter.put(
  "/alerts",
  route(async (request, response) => {
    const { events } = z.object({ events: z.array(z.enum(CLIENT_EVENT_TYPES)) }).parse(request.body);
    response.json({ alertEvents: (await appnigma.alerts.set({ events })).events });
  }),
);

notificationsRouter.put(
  "/sync",
  route(async (request, response) => {
    const { on } = z.object({ on: z.boolean() }).parse(request.body);
    response.json({ sync: await appnigma.sync.set({ on }) });
  }),
);

// Every event but records.changed is kept for 30 days, with how it went at each webhook.
notificationsRouter.get(
  "/events",
  route(async (request, response) => {
    const { type, cursor } = eventLogQuerySchema.parse(request.query);
    const page = await appnigma.events.list({ type, cursor, limit: EVENTS_PAGE_SIZE });
    const log: EventLogPage = { events: page.events, nextCursor: page.nextCursor };
    response.json(log);
  }),
);

// The receiver. The body stays raw bytes here: verifyWebhook checks the
// signature on the body exactly as it arrived, before anything parses it, and
// throws SdkWebhookSignatureError when it is not from Appnigma. No sign-in:
// the signature is what proves the sender. It answers fast: Appnigma tries
// again on anything but a 2xx within 10 seconds, so slow work belongs after
// the answer.
const webhookReceiverRouter = Router();

webhookReceiverRouter.use(express.raw({ type: "*/*", limit: "1mb" }));

webhookReceiverRouter.post(
  "/",
  route(async (request, response) => {
    const body: Uint8Array | string = Buffer.isBuffer(request.body) ? request.body : "";
    const event = await verifyWebhook(body, request.get(SIGNATURE_HEADER), currentWebhookSecret());
    // The same event can arrive twice, so one already kept is dropped.
    if (!received.some((kept) => kept.event.id === event.id)) {
      received.unshift({ receivedAt: new Date().toISOString(), event });
      received.splice(RECEIVED_EVENTS_LIMIT);
      // Changes in a customer's account go straight into this app's copy of their records.
      if (event.type === "records.changed") keepPushedChanges(event.data);
    }
    response.json({ received: event.id });
  }),
);

export { notificationsRouter, WEBHOOK_RECEIVER_PATH, webhookReceiverRouter };
