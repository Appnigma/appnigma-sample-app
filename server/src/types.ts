import type {
  ClientEvent,
  ClientEventType,
  ConnectField,
  ConnectionStatus,
  CrmCompany,
  CrmContact,
  CrmDeal,
  DeleteEndCustomerOutput,
  EndCustomerEntry,
  FunctionEntry,
  GetLogicGoLiveStatusOutput,
  JsonObject,
  ListedClientEvent,
  LogicRun,
  PlatformConnectionType,
  PlatformCoverage,
  PlatformSupport,
  RunOutput,
  SdkObject,
  SyncHealth,
  SyncSettings,
  Webhook,
} from "@appnigma/sdk";

// What the server answers and the web app reads: the shapes both sides share.

// The app shell
type FeaturesOn = {
  portal: boolean;
  sync: boolean;
};

type AppInfo = {
  productName: string;
  brandColor: string;
  accounts: string[];
  signedInAs: string | null;
  callsAvailable: boolean;
  features: FeaturesOn;
};

type SdkCallRecord = {
  id: number;
  sdkMethod: string;
  httpMethod: string;
  path: string;
  status: number | null;
  durationMs: number;
  at: string;
};

// Integrations
type IntegrationStatus = ConnectionStatus | "not_connected";

// Whether a platform holds CRM records: its coverage says so, says not, or
// couldn't be read just now. Unknown still counts: its CRM calls answer for themselves.
type CrmData = "covered" | "unknown" | "none";

type Integration = {
  platform: string;
  label: string;
  logoUrl: string | null;
  support: PlatformSupport;
  crmData: CrmData;
  connectionType: PlatformConnectionType;
  status: IntegrationStatus;
};

type IntegrationDetail = Integration & {
  coverage: PlatformCoverage[];
  fields: ConnectField[];
  sync: SyncHealth | null;
};

type AccountDetail = {
  label: string;
  value: string;
};

// Customers: the connected CRM's records
type RecordKind = "contacts" | "companies" | "deals";

// Each list is read on its own: one the CRM refuses comes back empty, with why
// in plain words under problems, and the others still show.
type CustomerOverview = {
  platform: string | null;
  platformLabel: string | null;
  companies: CrmCompany[];
  contacts: CrmContact[];
  deals: CrmDeal[];
  problems: Partial<Record<RecordKind, string>>;
};

type CustomerRecord = { kind: "contacts"; record: CrmContact } | { kind: "companies"; record: CrmCompany } | { kind: "deals"; record: CrmDeal };

type RecordEdit =
  | { kind: "contacts"; platform: string; firstName: string; lastName: string; email: string; phone?: string }
  | { kind: "companies"; platform: string; name: string; domain?: string }
  | { kind: "deals"; platform: string; name: string; amount: number | null; closeDate: string | null };

// Actions: the ready-made jobs a platform has, each with the box its page
// draws for every field of its input, read from the input's JSON Schema
type ActionFieldType = "text" | "number" | "integer" | "boolean" | "choice" | "list" | "json";

type ActionField = {
  name: string;
  type: ActionFieldType;
  required: boolean;
  description: string | null;
  // The values a choice can take; empty for every other type.
  choices: string[];
};

type IntegrationAction = {
  name: string;
  description: string;
  // Null when the input is not one set of fields, such as one of several
  // shapes: the page then takes the whole input as JSON.
  fields: ActionField[] | null;
};

type ActionResult = {
  output: JsonObject;
};

// Calls, from Gong's ready-made actions
type RecordedCall = {
  id: string;
  title: string;
  startedAt: string;
  durationSeconds: number;
};

type TranscriptPart = {
  speakerId: string;
  speakerName?: string;
  sentences: { start: number; text: string }[];
};

// Custom logic: one workspace's own rules on one integration
type LogicStage = "writing" | "testing" | "ready" | "needs_change" | "not_built" | "going_live" | "live" | "failed";

// The one try on a sample record: whether it did what it should, in words.
type LogicTest = {
  passed: boolean;
  words: string;
  calls: string[];
};

type NewCustomLogic = {
  request: string;
  object: SdkObject;
  operation: "read" | "write";
  timing: "before" | "after";
};

type CustomLogicItem = {
  name: string;
  asked: string | null;
  summary: string | null;
  description: string | null;
  stage: LogicStage;
  reason: string | null;
  test: LogicTest | null;
  hasDraft: boolean;
  alwaysOn: boolean;
  on: boolean;
  logicId: string | null;
  version: number | null;
  startedAt: string | null;
};

type CustomLogicList = {
  logic: CustomLogicItem[];
  heldBack: string[];
};

type CustomLogicDraft = {
  code: string;
  revision: number;
  updatedAt: string;
  goingLive: boolean;
};

type CustomLogicDetail = {
  item: CustomLogicItem;
  liveCode: string | null;
  liveCodeSha: string | null;
  draft: CustomLogicDraft | null;
};

type CustomLogicGoLive = GetLogicGoLiveStatusOutput;

type CustomLogicSwitch = {
  on: boolean;
  runs: boolean;
};

type CustomLogicRuns = {
  runs: LogicRun[];
};

// Webhooks, alerts and the event log
type ReceivedEvent = {
  receivedAt: string;
  event: ClientEvent;
};

type NotificationSettings = {
  receiverUrl: string;
  secretKept: boolean;
  webhooks: Webhook[];
  eventTypes: ClientEventType[];
  alertEvents: ClientEventType[];
  sync: SyncSettings;
  received: ReceivedEvent[];
};

type CreatedWebhook = {
  webhook: Webhook;
  secret: string;
};

type EventLogPage = {
  events: ListedClientEvent[];
  nextCursor: string | null;
};

// This app's copy of its customers' records
type RecentChange = {
  object: SdkObject;
  recordId: string;
  name: string;
  updatedAt: string;
};

type RecentChanges = {
  // Whether keeping a copy is switched on at all.
  syncOn: boolean;
  // Whether this platform's changes can be copied: on, and the platform can list its changes by time.
  available: boolean;
  // When the background job last read this account, or null before its first read.
  lastReadAt: string | null;
  changes: RecentChange[];
};

// Admin: workspaces and your own functions
type WorkspacePage = {
  workspaces: EndCustomerEntry[];
  next: string | null;
};

type WorkspaceRemoval = DeleteEndCustomerOutput;

type FunctionList = {
  functions: FunctionEntry[];
};

type FunctionRun = {
  endCustomerId: string;
  platform: string;
  functionName: string;
  input: JsonObject;
};

type FunctionResult = RunOutput;

export type {
  CustomLogicDetail,
  CustomLogicDraft,
  CustomLogicGoLive,
  CustomLogicItem,
  CustomLogicList,
  CustomLogicRuns,
  CustomLogicSwitch,
  LogicStage,
  LogicTest,
  NewCustomLogic,
  AccountDetail,
  ActionField,
  ActionFieldType,
  ActionResult,
  AppInfo,
  CreatedWebhook,
  CrmData,
  CustomerOverview,
  CustomerRecord,
  EventLogPage,
  FeaturesOn,
  FunctionList,
  FunctionResult,
  FunctionRun,
  Integration,
  IntegrationAction,
  IntegrationDetail,
  IntegrationStatus,
  NotificationSettings,
  ReceivedEvent,
  RecentChange,
  RecentChanges,
  RecordedCall,
  RecordEdit,
  RecordKind,
  SdkCallRecord,
  TranscriptPart,
  WorkspacePage,
  WorkspaceRemoval,
};
