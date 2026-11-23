import { Router } from "express";
import { route } from "./errors.js";
import { currentEndCustomerId, requireSignedIn, signedInWorkspace } from "./session.js";
import type { SdkCallRecord } from "./types.js";

// Not needed in your app. This keeps the last calls each signed-in customer's
// requests made through the SDK, for the "Under the hood" panel.

const SDK_ROUTE_PREFIX = "/sdk/v1";

const CALL_LOG_LIMIT = 40;

// How each SDK call shows up on the wire, so the panel can name it.
const SDK_METHOD_ROUTES: { httpMethod: string; pattern: RegExp; name: string }[] = [
  { httpMethod: "GET", pattern: /^\/platforms$/, name: "platforms.list" },
  { httpMethod: "POST", pattern: /^\/platforms\/get$/, name: "platforms.get" },
  { httpMethod: "GET", pattern: /^\/features$/, name: "features.list" },
  { httpMethod: "POST", pattern: /^\/connections\/link$/, name: "connections.createLink" },
  { httpMethod: "GET", pattern: /^\/connect-key$/, name: "connections.connect" },
  { httpMethod: "POST", pattern: /^\/connections\/connect$/, name: "connections.connect" },
  { httpMethod: "POST", pattern: /^\/connections\/get$/, name: "connections.get" },
  { httpMethod: "GET", pattern: /^\/connections$/, name: "connections.list" },
  { httpMethod: "POST", pattern: /^\/connections\/disconnect$/, name: "connections.disconnect" },
  { httpMethod: "POST", pattern: /^\/end-customers\/delete$/, name: "endCustomers.delete" },
  { httpMethod: "POST", pattern: /^\/crm\/(contacts|companies|deals)\/(list|get|create|update)$/, name: "crm.$1.$2" },
  { httpMethod: "POST", pattern: /^\/request$/, name: "request" },
  { httpMethod: "GET", pattern: /^\/actions$/, name: "actions.list" },
  { httpMethod: "POST", pattern: /^\/actions\/run$/, name: "actions.run" },
  { httpMethod: "GET", pattern: /^\/functions$/, name: "catalog" },
  { httpMethod: "POST", pattern: /^\/run$/, name: "run" },
  { httpMethod: "POST", pattern: /^\/portal\/link$/, name: "portal.createLink" },
  { httpMethod: "GET", pattern: /^\/guide$/, name: "guide" },
  { httpMethod: "POST", pattern: /^\/logic\/go-live-status$/, name: "logic.goLiveStatus" },
  { httpMethod: "POST", pattern: /^\/logic\/go-live$/, name: "logic.goLive" },
  { httpMethod: "POST", pattern: /^\/logic\/switch-off$/, name: "logic.switchOff" },
  { httpMethod: "POST", pattern: /^\/logic\/switch-on$/, name: "logic.switchOn" },
  { httpMethod: "POST", pattern: /^\/logic\/(list|get|create|update|discard|check|runs|edit|test)$/, name: "logic.$1" },
  { httpMethod: "POST", pattern: /^\/webhooks\/create$/, name: "webhooks.create" },
  { httpMethod: "GET", pattern: /^\/webhooks$/, name: "webhooks.list" },
  { httpMethod: "POST", pattern: /^\/webhooks\/delete$/, name: "webhooks.delete" },
  { httpMethod: "POST", pattern: /^\/events\/list$/, name: "events.list" },
  { httpMethod: "GET", pattern: /^\/alerts$/, name: "alerts.get" },
  { httpMethod: "POST", pattern: /^\/alerts\/set$/, name: "alerts.set" },
  { httpMethod: "GET", pattern: /^\/sync$/, name: "sync.get" },
  { httpMethod: "POST", pattern: /^\/sync\/set$/, name: "sync.set" },
  { httpMethod: "POST", pattern: /^\/records\/changes$/, name: "records.changes" },
];

const logs = new Map<string, SdkCallRecord[]>();
let nextId = 1;

const logKeyOf = (endCustomerId: string | null): string => endCustomerId ?? "-";

const sdkMethodOf = (httpMethod: string, path: string): string => {
  for (const sdkRoute of SDK_METHOD_ROUTES) {
    if (sdkRoute.httpMethod === httpMethod && sdkRoute.pattern.test(path)) return path.replace(sdkRoute.pattern, sdkRoute.name);
  }
  return `${httpMethod} ${path}`;
};

const urlOf = (input: Parameters<typeof fetch>[0]): URL => new URL(input instanceof Request ? input.url : String(input));

// Wraps the fetch the SDK client uses, so each call it makes is written down.
const recordSdkCalls = (baseFetch: typeof fetch): typeof fetch => {
  const recording: typeof fetch = async (input, init) => {
    const started = Date.now();
    const httpMethod = init?.method ?? "GET";
    const path = urlOf(input).pathname.replace(SDK_ROUTE_PREFIX, "");
    let status: number | null = null;
    try {
      const response = await baseFetch(input, init);
      status = response.status;
      return response;
    } finally {
      const key = logKeyOf(currentEndCustomerId());
      const log = logs.get(key) ?? [];
      log.unshift({ id: nextId++, sdkMethod: sdkMethodOf(httpMethod, path), httpMethod, path, status, durationMs: Date.now() - started, at: new Date().toISOString() });
      logs.set(key, log.slice(0, CALL_LOG_LIMIT));
    }
  };
  return recording;
};

const underTheHoodRouter = Router();

underTheHoodRouter.use(requireSignedIn);

underTheHoodRouter.get(
  "/",
  route(async (_request, response) => {
    response.json({ calls: logs.get(logKeyOf(signedInWorkspace())) ?? [] });
  }),
);

export { recordSdkCalls, underTheHoodRouter };
