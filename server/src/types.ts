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
  JsonValue,
  ListedClientEvent,
  LogicEntry,
  LogicProblem,
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

type IntegrationAction = {
  name: string;
  description: string;
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

// Automations: the workspace's own custom logic
type NewAutomation = {
  platform: string;
  name: string;
  object: SdkObject;
  operation: "read" | "write";
  timing: "before" | "after";
  request: string;
};

type AutomationDraft = {
  code: string;
  revision: number;
  updatedAt: string;
  goingLive: boolean;
};

type AutomationDetail = {
  platform: string;
  name: string;
  entry: LogicEntry | null;
  liveCode: string | null;
  liveCodeSha: string | null;
  draft: AutomationDraft | null;
};

type AutomationList = {
  automations: LogicEntry[];
  heldBack: string[];
};

type AutomationChange = {
  saved: boolean;
  summary: string | null;
  problems: LogicProblem[];
  revision: number | null;
};

type AutomationCheck = {
  ready: boolean;
  problems: LogicProblem[];
};

type AutomationTrial = {
  outcome: "answered" | "failed" | "no_answer" | "did_not_build";
  summary: string;
  output: JsonValue;
  calls: string[];
  problems: LogicProblem[];
};

type AutomationGoLive = GetLogicGoLiveStatusOutput;

type AutomationSwitch = {
  on: boolean;
  runs: boolean;
};

type AutomationRuns = {
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
  AccountDetail,
  AppInfo,
  AutomationChange,
  AutomationCheck,
  AutomationDetail,
  AutomationDraft,
  AutomationGoLive,
  AutomationList,
  AutomationRuns,
  AutomationSwitch,
  AutomationTrial,
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
  NewAutomation,
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
