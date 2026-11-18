import type { GetLogicGoLiveStatusOutput, JsonValue, LogicEntry, LogicProblem, LogicRun } from "@appnigma/sdk";
import type { z } from "zod";
import type { newAutomationSchema } from "../schemas/request.schemas.js";

type NewAutomation = z.infer<typeof newAutomationSchema>;

type AutomationRef = {
  endCustomerId: string;
  platform: string;
  name: string;
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

export type {
  AutomationChange,
  AutomationCheck,
  AutomationDetail,
  AutomationDraft,
  AutomationGoLive,
  AutomationList,
  AutomationRef,
  AutomationRuns,
  AutomationSwitch,
  AutomationTrial,
  NewAutomation,
};
