import { SDK_CALL_LOG_LIMIT, SDK_METHOD_ROUTES, SDK_ROUTE_PREFIX } from "../constants/sdk-methods.js";
import type { SdkCallRecord } from "../types/sdk-call.types.js";
import { currentContext } from "./request-context.js";

// Not needed in your app. This keeps the last calls each signed-in customer's
// requests made through the SDK, for the "Under the hood" panel.
const logs = new Map<string, SdkCallRecord[]>();
let nextId = 1;

const logKeyOf = (endCustomerId: string | null): string => endCustomerId ?? "-";

const sdkMethodOf = (httpMethod: string, path: string): string => {
  for (const route of SDK_METHOD_ROUTES) {
    if (route.httpMethod === httpMethod && route.pattern.test(path)) return path.replace(route.pattern, route.name);
  }
  return `${httpMethod} ${path}`;
};

const urlOf = (input: Parameters<typeof fetch>[0]): URL => new URL(input instanceof Request ? input.url : String(input));

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
      const context = currentContext();
      const key = logKeyOf(context?.endCustomerId ?? null);
      const log = logs.get(key) ?? [];
      log.unshift({ id: nextId++, sdkMethod: sdkMethodOf(httpMethod, path), httpMethod, path, status, durationMs: Date.now() - started, at: new Date().toISOString() });
      logs.set(key, log.slice(0, SDK_CALL_LOG_LIMIT));
    }
  };
  return recording;
};

const recentSdkCalls = (endCustomerId: string): SdkCallRecord[] => logs.get(logKeyOf(endCustomerId)) ?? [];

export { recentSdkCalls, recordSdkCalls };
