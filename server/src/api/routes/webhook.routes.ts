import express, { Router } from "express";
import { WEBHOOK_BODY_LIMIT } from "../../constants/webhooks.js";
import { receiveWebhookController } from "../controllers/notifications.controller.js";

// The body stays raw bytes here: the signature is over the body exactly as it
// arrived, so it is checked before anything parses it. No sign-in: the
// signature is what proves the sender.
const webhookRouter = Router();

webhookRouter.use(express.raw({ type: "*/*", limit: WEBHOOK_BODY_LIMIT }));
webhookRouter.post("/", receiveWebhookController);

export { webhookRouter };
