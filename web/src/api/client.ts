import type { ClientEventType, JsonObject, SyncSettings } from "@appnigma/sdk";
import type { ActionResult, AppInfo } from "@server-types";
import type { CustomLogicDetail, CustomLogicGoLive, CustomLogicList, CustomLogicRuns, CustomLogicSwitch, NewCustomLogic } from "@server-types";
import type { RecordedCall, TranscriptPart } from "@server-types";
import type { RecentChanges } from "@server-types";
import type { CustomerOverview, CustomerRecord, RecordEdit, RecordKind } from "@server-types";
import type { FunctionList, FunctionResult, FunctionRun } from "@server-types";
import type { AccountDetail, Integration, IntegrationAction, IntegrationDetail, IntegrationStatus } from "@server-types";
import type { CreatedWebhook, EventLogPage, NotificationSettings } from "@server-types";
import type { SdkCallRecord } from "@server-types";
import type { WorkspacePage, WorkspaceRemoval } from "@server-types";
import type { ApiErrorBody } from "../types/ui.types";

// A refusal from this app's server, with the SDK's code when it came from one,
// and the feature it names when that feature is off.
class ApiError extends Error {
  readonly code: string | null;
  readonly feature: string | null;

  constructor(message: string, code: string | null, feature: string | null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.feature = feature;
  }
}

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
    throw new ApiError(failure.error?.message ?? `The server answered ${response.status}`, failure.error?.code ?? null, failure.error?.feature ?? null);
  }
  const answer: Answer = await response.json();
  return answer;
};

// One integration's custom logic, and one rule in it.
const logicPath = (platform: string, name?: string): string =>
  `/api/integrations/${encodeURIComponent(platform)}/logic${name === undefined ? "" : `/${encodeURIComponent(name)}`}`;

const query = (values: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) search.set(key, value);
  const text = search.toString();
  return text ? `?${text}` : "";
};

const api = {
  app: () => request<AppInfo>("GET", "/api/app"),
  signIn: (account: string) => request<{ signedInAs: string }>("POST", "/api/app/session", { account }),
  signOut: () => request<{ signedInAs: null }>("DELETE", "/api/app/session"),
  integrations: () => request<{ integrations: Integration[] }>("GET", "/api/integrations"),
  integration: (platform: string) => request<{ integration: IntegrationDetail }>("GET", `/api/integrations/${platform}`),
  actions: (platform: string) => request<{ actions: IntegrationAction[] }>("GET", `/api/integrations/${platform}/actions`),
  runAction: (platform: string, action: string, input: JsonObject) =>
    request<ActionResult>("POST", `/api/integrations/${platform}/actions/${encodeURIComponent(action)}/run`, { input }),
  account: (platform: string) => request<{ account: AccountDetail[] }>("GET", `/api/integrations/${platform}/account`),
  changes: (platform: string) => request<RecentChanges>("GET", `/api/integrations/${platform}/changes`),
  connect: (platform: string) => request<{ url: string }>("POST", `/api/integrations/${platform}/connect`),
  connectWithDetails: (platform: string, fields: Record<string, string>) =>
    request<{ status: IntegrationStatus }>("POST", `/api/integrations/${platform}/connect-with-details`, { fields }),
  disconnect: (platform: string) => request<{ disconnected: boolean }>("POST", `/api/integrations/${platform}/disconnect`),
  customers: () => request<CustomerOverview>("GET", "/api/customers"),
  customerRecord: (kind: RecordKind, id: string, platform: string) => request<CustomerRecord>("GET", `/api/customers/${kind}/${encodeURIComponent(id)}${query({ platform })}`),
  updateCustomerRecord: (kind: RecordKind, id: string, edit: RecordEdit) => request<CustomerRecord>("PATCH", `/api/customers/${kind}/${encodeURIComponent(id)}`, edit),
  addContact: (input: { platform: string; firstName: string; lastName: string; email: string }) => request<{ contact: object }>("POST", "/api/customers/contacts", input),
  addCompany: (input: { platform: string; name: string; domain: string }) => request<{ company: object }>("POST", "/api/customers/companies", input),
  addDeal: (input: { platform: string; name: string; amount?: number; closeDate?: string; companyId?: string }) => request<{ deal: object }>("POST", "/api/customers/deals", input),
  calls: () => request<{ calls: RecordedCall[] }>("GET", "/api/calls"),
  transcript: (callId: string) => request<{ transcript: TranscriptPart[] }>("GET", `/api/calls/${callId}/transcript`),
  customLogic: (platform: string) => request<CustomLogicList>("GET", logicPath(platform)),
  createCustomLogic: (platform: string, input: NewCustomLogic) => request<{ name: string }>("POST", logicPath(platform), input),
  customLogicDetail: (platform: string, name: string) => request<CustomLogicDetail>("GET", logicPath(platform, name)),
  changeCustomLogic: (platform: string, name: string, words: string) => request<{ name: string }>("POST", `${logicPath(platform, name)}/change`, { request: words }),
  saveCustomLogicCode: (platform: string, name: string, input: { code: string; revision: number; liveCodeSha?: string }) =>
    request<{ revision: number }>("PUT", `${logicPath(platform, name)}/code`, input),
  putCustomLogicLive: (platform: string, name: string, revision: number) => request<CustomLogicGoLive>("POST", `${logicPath(platform, name)}/go-live`, { revision }),
  customLogicGoLive: (platform: string, name: string) => request<CustomLogicGoLive>("GET", `${logicPath(platform, name)}/go-live`),
  discardCustomLogic: (platform: string, name: string, revision: number) => request<{ discarded: boolean }>("POST", `${logicPath(platform, name)}/discard`, { revision }),
  switchCustomLogic: (platform: string, logicId: string, on: boolean) =>
    request<CustomLogicSwitch>("POST", `${logicPath(platform)}/by-id/${encodeURIComponent(logicId)}/switch`, { on }),
  customLogicRuns: (platform: string, logicId: string) => request<CustomLogicRuns>("GET", `${logicPath(platform)}/by-id/${encodeURIComponent(logicId)}/runs`),
  workspaces: (cursor?: string) => request<WorkspacePage>("GET", `/api/admin/workspaces${query({ cursor })}`),
  removeWorkspace: (endCustomerId: string) => request<WorkspaceRemoval>("POST", "/api/admin/workspaces/remove", { endCustomerId }),
  selfServeLink: (endCustomerId: string) => request<{ url: string }>("POST", "/api/admin/workspaces/self-serve-link", { endCustomerId }),
  notifications: () => request<NotificationSettings>("GET", "/api/admin/notifications"),
  addWebhook: (url: string) => request<CreatedWebhook>("POST", "/api/admin/webhooks", { url }),
  removeWebhook: (webhookId: string) => request<{ deleted: boolean }>("DELETE", `/api/admin/webhooks/${encodeURIComponent(webhookId)}`),
  chooseAlerts: (events: ClientEventType[]) => request<{ alertEvents: ClientEventType[] }>("PUT", "/api/admin/alerts", { events }),
  switchSync: (on: boolean) => request<{ sync: SyncSettings }>("PUT", "/api/admin/sync", { on }),
  eventLog: (type?: ClientEventType, cursor?: string) => request<EventLogPage>("GET", `/api/admin/events${query({ type, cursor })}`),
  functions: () => request<FunctionList>("GET", "/api/admin/functions"),
  runFunction: (run: FunctionRun) => request<FunctionResult>("POST", "/api/admin/functions/run", run),
  guide: () => request<{ guide: string }>("GET", "/api/admin/guide"),
  underTheHood: () => request<{ calls: SdkCallRecord[] }>("GET", "/api/under-the-hood"),
};

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const codeOf = (error: unknown): string | null => (error instanceof ApiError ? error.code : null);

export { api, codeOf, messageOf };
