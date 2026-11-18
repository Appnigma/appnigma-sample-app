import type { Request, Response } from "express";
import { WEBHOOK_SIGNATURE_HEADER } from "../../constants/webhooks.js";
import { alertsSchema, eventLogQuerySchema, newWebhookSchema, syncSchema, webhookIdParamSchema } from "../../schemas/request.schemas.js";
import { addWebhook, chooseAlerts, eventLog, notificationSettings, receiveWebhook, removeWebhook, switchSync } from "../../services/notifications.service.js";
import { respondWithError } from "./respond.js";

const notificationSettingsController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await notificationSettings());
  } catch (error) {
    respondWithError(response, error);
  }
};

const addWebhookController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { url } = newWebhookSchema.parse(request.body);
    response.status(201).json(await addWebhook(url));
  } catch (error) {
    respondWithError(response, error);
  }
};

const removeWebhookController = async (request: Request, response: Response): Promise<void> => {
  try {
    await removeWebhook(webhookIdParamSchema.parse(request.params.webhookId));
    response.json({ deleted: true });
  } catch (error) {
    respondWithError(response, error);
  }
};

const chooseAlertsController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { events } = alertsSchema.parse(request.body);
    response.json({ alertEvents: await chooseAlerts(events) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const switchSyncController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { on } = syncSchema.parse(request.body);
    response.json({ sync: await switchSync(on) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const eventLogController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { type, cursor } = eventLogQuerySchema.parse(request.query);
    response.json(await eventLog(type, cursor));
  } catch (error) {
    respondWithError(response, error);
  }
};

// Answers fast: Appnigma tries again on anything but a 2xx within 10 seconds,
// so slow work belongs after the answer. The body here is the raw bytes.
const receiveWebhookController = async (request: Request, response: Response): Promise<void> => {
  try {
    const body: Uint8Array | string = Buffer.isBuffer(request.body) ? request.body : "";
    const event = await receiveWebhook(body, request.get(WEBHOOK_SIGNATURE_HEADER));
    response.json({ received: event.id });
  } catch (error) {
    respondWithError(response, error);
  }
};

export {
  addWebhookController,
  chooseAlertsController,
  eventLogController,
  notificationSettingsController,
  receiveWebhookController,
  removeWebhookController,
  switchSyncController,
};
