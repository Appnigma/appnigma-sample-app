import type { JsonObject, TestLogicOutput } from "@appnigma/sdk";
import { AUTOMATION_RUNS_PAGE_SIZE } from "../constants/automations.js";
import { appnigma } from "../lib/appnigma.js";
import type {
  AutomationChange,
  AutomationCheck,
  AutomationDetail,
  AutomationGoLive,
  AutomationList,
  AutomationRef,
  AutomationRuns,
  AutomationSwitch,
  AutomationTrial,
  NewAutomation,
} from "../types/automation.types.js";

// Automations are the workspace's own custom logic: small pieces of code that
// run around its integration calls. Every call names the workspace as
// endCustomerId, so each workspace only ever sees and changes its own.

const listAutomations = async (endCustomerId: string): Promise<AutomationList> => {
  const { logic, folderProblems } = await appnigma.logic.list({ endCustomerId });
  return { automations: logic, heldBack: folderProblems.map((problem) => problem.reason) };
};

const automationDetail = async (ref: AutomationRef): Promise<AutomationDetail> => {
  const opened = await appnigma.logic.get(ref);
  return {
    platform: opened.platform,
    name: opened.name,
    entry: opened.entry,
    liveCode: opened.file?.source ?? null,
    liveCodeSha: opened.file?.sha ?? null,
    draft: opened.draft
      ? { code: opened.draft.source, revision: opened.draft.revision, updatedAt: opened.draft.updatedAt, goingLive: opened.draft.goingLiveRevision !== null }
      : null,
  };
};

// Asking in plain words: edit writes the change, from the draft or else what
// is live, and saves it as a draft only when it passes the checks.
const changeAutomation = async (ref: AutomationRef, request: string, revision?: number): Promise<AutomationChange> => {
  const edited = await appnigma.logic.edit({ ...ref, prompt: request, revision, requestedBy: ref.endCustomerId });
  return { saved: edited.saved, summary: edited.summary, problems: edited.problems, revision: edited.draft?.revision ?? null };
};

// A new automation starts from the template around one CRM call, then the
// workspace's own words write it.
const createAutomation = async (endCustomerId: string, automation: NewAutomation): Promise<AutomationChange> => {
  const ref = { endCustomerId, platform: automation.platform, name: automation.name };
  const created = await appnigma.logic.create({ ...ref, trigger: { object: automation.object, operation: automation.operation, timing: automation.timing } });
  return changeAutomation(ref, automation.request, created.draft.revision);
};

// Saving the code by hand, from View code: on the draft's revision, or 0 with
// the live file's sha for the first change to what is live.
const saveAutomationCode = async (ref: AutomationRef, code: string, revision: number, liveCodeSha?: string): Promise<number> => {
  const saved = await appnigma.logic.update({ ...ref, source: code, revision, ...(revision === 0 && liveCodeSha ? { baseSha: liveCodeSha } : {}) });
  return saved.revision;
};

const checkAutomation = async (ref: AutomationRef): Promise<AutomationCheck> => {
  const { problems } = await appnigma.logic.check(ref);
  return { ready: problems.length === 0, problems };
};

const trialSummaryOf = (tried: TestLogicOutput): Pick<AutomationTrial, "outcome" | "summary"> => {
  if (!tried.ran) return { outcome: "did_not_build", summary: "It could not run yet: it does not pass the checks." };
  if (!tried.finished) return { outcome: "no_answer", summary: "It started but gave no answer." };
  if (tried.error) return { outcome: "failed", summary: `It stopped with: ${tried.error.message}` };
  const calls = tried.calls.length;
  return { outcome: "answered", summary: calls === 0 ? "It ran and answered without calling anything." : `It ran and would make ${calls} ${calls === 1 ? "call" : "calls"}.` };
};

// Trying it once on a sample, in a sandbox with no internet: every call it
// would make is written down and answered empty, so nothing real changes.
const tryAutomation = async (ref: AutomationRef, input: JsonObject): Promise<AutomationTrial> => {
  const tried = await appnigma.logic.test({ ...ref, input, requestedBy: ref.endCustomerId });
  return { ...trialSummaryOf(tried), output: tried.output, calls: tried.calls.map((call) => `${call.method} ${call.url}`), problems: tried.problems };
};

const putAutomationLive = async (ref: AutomationRef, revision: number): Promise<AutomationGoLive> => {
  const going = await appnigma.logic.goLive({ ...ref, revision });
  return { platform: going.platform, name: going.name, state: going.state };
};

const goLiveProgress = async (ref: AutomationRef): Promise<AutomationGoLive> => appnigma.logic.goLiveStatus(ref);

const throwAwayDraft = async (ref: AutomationRef, revision: number): Promise<void> => {
  await appnigma.logic.discard({ ...ref, revision });
};

// An always-on automation has a switch per workspace; nothing is pushed, the
// next call reads it.
const switchAutomation = async (endCustomerId: string, logicId: string, on: boolean): Promise<AutomationSwitch> => {
  const switched = on ? await appnigma.logic.switchOn({ logicId, endCustomerId }) : await appnigma.logic.switchOff({ logicId, endCustomerId });
  return { on: switched.on, runs: switched.runs };
};

const automationRuns = async (endCustomerId: string, logicId: string): Promise<AutomationRuns> => {
  const { runs } = await appnigma.logic.runs({ logicId, endCustomerId, limit: AUTOMATION_RUNS_PAGE_SIZE });
  return { runs };
};

// The hosted automation editor, for one workspace. Each link works once.
const automationEditorLink = async (endCustomerId: string): Promise<string> => {
  const link = await appnigma.portal.createLink({ endCustomerId });
  return link.url;
};

export {
  automationDetail,
  automationEditorLink,
  automationRuns,
  changeAutomation,
  checkAutomation,
  createAutomation,
  goLiveProgress,
  listAutomations,
  putAutomationLive,
  saveAutomationCode,
  switchAutomation,
  throwAwayDraft,
  tryAutomation,
};
