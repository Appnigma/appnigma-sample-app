import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { env } from "./env.js";
import { adminRouter } from "./features/admin.js";
import { appRouter } from "./features/app.js";
import { callsRouter } from "./features/calls.js";
import { customersRouter } from "./features/customers.js";
import { customLogicRouter } from "./features/custom-logic.js";
import { integrationsRouter } from "./features/integrations.js";
import { notificationsRouter, WEBHOOK_RECEIVER_PATH, webhookReceiverRouter } from "./features/webhooks.js";
import { startRecordSync } from "./jobs/record-sync.js";
import { withSession } from "./session.js";
import { underTheHoodRouter } from "./under-the-hood.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
// Mounted before the JSON parser, which would otherwise read the body first.
app.use(WEBHOOK_RECEIVER_PATH, webhookReceiverRouter);
app.use(express.json({ limit: "100kb" }));

app.get("/healthz", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api", withSession);
app.use("/api/app", appRouter);
// The more specific path first, so a rule's routes never reach the integrations router.
app.use("/api/integrations/:platform/logic", customLogicRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/calls", callsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", notificationsRouter);
app.use("/api/under-the-hood", underTheHoodRouter);
app.use("/api", (_request, response) => {
  response.status(404).json({ error: { message: "There is no such API route" } });
});

// In production the server also serves the built web app; every other GET
// answers its index so the app's own router can take over.
const indexFile = path.join(env.webDistDirectory, "index.html");
if (existsSync(indexFile)) {
  app.use(express.static(env.webDistDirectory, { index: false, maxAge: "1h" }));
  app.use(withSession, (request, response, next) => {
    if (request.method !== "GET") return next();
    response.sendFile(indexFile);
  });
}

app.listen(env.port, () => {
  console.log(`Sample app on ${env.publicUrl} (port ${env.port})`);
  startRecordSync();
  if (!env.publicUrl.startsWith("https://") && !env.returnPageUrl) {
    console.warn("PUBLIC_URL is not https and RETURN_PAGE_URL is not set, so connecting a platform will be refused. Set RETURN_PAGE_URL, or use an https address such as a tunnel.");
  }
});
