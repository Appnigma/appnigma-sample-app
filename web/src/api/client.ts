import type { AppInfo } from "@server-types/app.types";
import type { RecordedCall, TranscriptPart } from "@server-types/call.types";
import type { CustomerOverview } from "@server-types/customer.types";
import type { Integration } from "@server-types/integration.types";
import type { SdkCallRecord } from "@server-types/sdk-call.types";
import type { ApiErrorBody } from "../types/ui.types";

// The browser only ever talks to this app's own server. The SDK key, and every
// call to Appnigma, stay on the server.
const request = async <Answer>(method: string, path: string, body?: object): Promise<Answer> => {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
    const failure: ApiErrorBody = isJson ? await response.json() : {};
    throw new Error(failure.error?.message ?? `The server answered ${response.status}`);
  }
  const answer: Answer = await response.json();
  return answer;
};

const api = {
  app: () => request<AppInfo>("GET", "/api/app"),
  signIn: (account: string) => request<{ signedInAs: string }>("POST", "/api/app/session", { account }),
  signOut: () => request<{ signedInAs: null }>("DELETE", "/api/app/session"),
  integrations: () => request<{ integrations: Integration[] }>("GET", "/api/integrations"),
  connect: (platform: string) => request<{ url: string }>("POST", `/api/integrations/${platform}/connect`),
  disconnect: (platform: string) => request<{ disconnected: boolean }>("POST", `/api/integrations/${platform}/disconnect`),
  customers: () => request<CustomerOverview>("GET", "/api/customers"),
  addContact: (input: { platform: string; firstName: string; lastName: string; email: string }) => request<{ contact: object }>("POST", "/api/customers/contacts", input),
  calls: () => request<{ calls: RecordedCall[] }>("GET", "/api/calls"),
  transcript: (callId: string) => request<{ transcript: TranscriptPart[] }>("GET", `/api/calls/${callId}/transcript`),
  underTheHood: () => request<{ calls: SdkCallRecord[] }>("GET", "/api/under-the-hood"),
};

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export { api, messageOf };
