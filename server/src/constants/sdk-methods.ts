import type { SdkMethodRoute } from "../types/sdk-call.types.js";

// How each SDK method shows up on the wire, so the "Under the hood" panel can name it.
const SDK_ROUTE_PREFIX = "/sdk/v1";

const SDK_METHOD_ROUTES: SdkMethodRoute[] = [
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

const SDK_CALL_LOG_LIMIT = 40;

export { SDK_CALL_LOG_LIMIT, SDK_METHOD_ROUTES, SDK_ROUTE_PREFIX };
