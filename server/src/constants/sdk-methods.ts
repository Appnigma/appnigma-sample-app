import type { SdkMethodRoute } from "../types/sdk-call.types.js";

// How each SDK method shows up on the wire, so the "Under the hood" panel can name it.
const SDK_ROUTE_PREFIX = "/sdk/v1";

const SDK_METHOD_ROUTES: SdkMethodRoute[] = [
  { httpMethod: "GET", pattern: /^\/platforms$/, name: "platforms.list" },
  { httpMethod: "POST", pattern: /^\/connections\/link$/, name: "connections.createLink" },
  { httpMethod: "POST", pattern: /^\/connections\/get$/, name: "connections.get" },
  { httpMethod: "GET", pattern: /^\/connections$/, name: "connections.list" },
  { httpMethod: "POST", pattern: /^\/connections\/disconnect$/, name: "connections.disconnect" },
  { httpMethod: "POST", pattern: /^\/crm\/(contacts|companies|deals)\/(list|get|create|update)$/, name: "crm.$1.$2" },
  { httpMethod: "POST", pattern: /^\/request$/, name: "request" },
  { httpMethod: "GET", pattern: /^\/actions$/, name: "actions.list" },
  { httpMethod: "POST", pattern: /^\/actions\/run$/, name: "actions.run" },
  { httpMethod: "GET", pattern: /^\/functions$/, name: "catalog" },
  { httpMethod: "POST", pattern: /^\/run$/, name: "run" },
  { httpMethod: "POST", pattern: /^\/portal\/link$/, name: "portal.createLink" },
  { httpMethod: "GET", pattern: /^\/guide$/, name: "guide" },
];

const SDK_CALL_LOG_LIMIT = 40;

export { SDK_CALL_LOG_LIMIT, SDK_METHOD_ROUTES, SDK_ROUTE_PREFIX };
