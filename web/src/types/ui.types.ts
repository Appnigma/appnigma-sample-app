import type { AppInfo } from "@server-types/app.types";

type AppContextValue = {
  app: AppInfo;
  refresh: () => Promise<void>;
  underTheHoodOpen: boolean;
  setUnderTheHoodOpen: (open: boolean) => void;
};

type ApiErrorBody = {
  error?: { message?: string; code?: string };
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

export type { ApiErrorBody, AppContextValue, ChecklistItem, PlatformInfo, PollingState, RecentRecord, SdkSnippet, StageSummary };
