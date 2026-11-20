import type { JsonObject } from "@appnigma/sdk";
import type { AppInfo } from "@server-types";

type AppContextValue = {
  app: AppInfo;
  refresh: () => Promise<void>;
  underTheHoodOpen: boolean;
  setUnderTheHoodOpen: (open: boolean) => void;
};

type ApiErrorBody = {
  error?: { message?: string; code?: string; feature?: string };
};

type PlatformInfo = {
  domain: string;
  color: string;
  category: string;
  description: string;
};

type SdkSnippet = {
  file: string;
  code: string;
};

type RecentRecord = {
  id: string;
  kind: "company" | "contact" | "deal";
  name: string;
  detail: string;
  updatedAt: string;
};

type ChecklistItem = {
  title: string;
  detail: string;
  done: boolean;
  to: string;
};

type StageSummary = {
  label: string;
  count: number;
  amount: number;
};

type PollingState<Value> = {
  data: Value | null;
  error: string | null;
  reload: () => Promise<void>;
};

type OpenRecord = {
  kind: "contacts" | "companies" | "deals";
  id: string;
};

type AddKind = "contact" | "company" | "deal";

type PlainStatus = {
  label: string;
  tone: "good" | "waiting" | "bad" | "quiet";
};

type PageMessage = {
  tone: PlainStatus["tone"];
  text: string;
};

type AdminTab = "workspaces" | "notifications" | "events" | "functions" | "guide";

// The tabs on a connected integration's page, and what its platform needs for each to show.
type IntegrationTab = "overview" | "actions" | "logic" | "mapping";

type IntegrationTabEntry = {
  key: IntegrationTab;
  label: string;
  needs: "nothing" | "actions" | "crm-data";
};

// One choice of a Segmented or a Picker: the value it sends and the word shown for it.
type Choice = {
  value: string;
  chip: string;
};

// An action's answer as its page shows it: each list of records at its top
// as a table, and the rest of it as JSON.
type OutputTable = {
  key: string;
  columns: string[];
  rows: JsonObject[];
};

type ActionOutputView = {
  tables: OutputTable[];
  rest: JsonObject | null;
};

// One row of the field mapping preview: a field in this app and the one it fills on the platform.
type MappingPreviewGroup = {
  object: string;
  pairs: { yours: string; theirs: string }[];
};

export type {
  ActionOutputView,
  AddKind,
  AdminTab,
  ApiErrorBody,
  AppContextValue,
  ChecklistItem,
  Choice,
  IntegrationTab,
  IntegrationTabEntry,
  MappingPreviewGroup,
  OpenRecord,
  OutputTable,
  PageMessage,
  PlainStatus,
  PlatformInfo,
  PollingState,
  RecentRecord,
  SdkSnippet,
  StageSummary,
};
