import type { AppInfo } from "@server-types/app.types";

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

export type {
  AddKind,
  AdminTab,
  ApiErrorBody,
  AppContextValue,
  ChecklistItem,
  OpenRecord,
  PageMessage,
  PlainStatus,
  PlatformInfo,
  PollingState,
  RecentRecord,
  SdkSnippet,
  StageSummary,
};
