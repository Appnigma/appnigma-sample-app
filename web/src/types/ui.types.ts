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

// The tabs on a connected integration's page.
type IntegrationTab = "overview" | "logic" | "mapping";

// One row of the field mapping preview: a field in this app and the one it fills on the platform.
type MappingPreviewGroup = {
  object: string;
  pairs: { yours: string; theirs: string }[];
};

export type {
  AddKind,
  AdminTab,
  ApiErrorBody,
  AppContextValue,
  ChecklistItem,
  IntegrationTab,
  MappingPreviewGroup,
  OpenRecord,
  PageMessage,
  PlainStatus,
  PlatformInfo,
  PollingState,
  RecentRecord,
  SdkSnippet,
  StageSummary,
};
