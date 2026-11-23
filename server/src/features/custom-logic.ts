import { SDK_OBJECTS } from "@appnigma/sdk";
import type { JsonObject, LogicEntry, SdkObject, TestLogicOutput } from "@appnigma/sdk";
import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { errorAnswerOf, route } from "../errors.js";
import { platformSchema } from "../inputs.js";
import { requireSignedIn, signedInWorkspace } from "../session.js";
import type { CustomLogicDetail, CustomLogicItem, CustomLogicList, CustomLogicRuns, CustomLogicSwitch, LogicStage, LogicTest } from "../types.js";

// Custom logic on one integration's page: the workspace's own rules, asked for
// in plain words. Every call names the workspace as endCustomerId, so each
// workspace only ever sees and changes its own.
//
// Writing a rule takes a minute or two, so it runs in the background here:
// the page starts it, then reads where it is (writing, then testing on a
// sample record, then ready to go live) until it settles.

const NAME_MAX_LENGTH = 48;
const NAME_WORDS = 5;
const REQUEST_MAX_LENGTH = 4000;
const CODE_MAX_LENGTH = 50_000;
const RUNS_PAGE_SIZE = 10;

const nameSchema = z
  .string()
  .trim()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "is not a logic name");

const wordsSchema = z.string().trim().min(1, "should say what should happen").max(REQUEST_MAX_LENGTH);

const newLogicSchema = z.object({
  request: wordsSchema,
  object: z.enum(SDK_OBJECTS),
  operation: z.enum(["read", "write"]),
  timing: z.enum(["before", "after"]),
});

const codeSchema = z.object({
  code: z.string().max(CODE_MAX_LENGTH),
  revision: z.number().int().min(0),
  liveCodeSha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
});

const revisionSchema = z.object({ revision: z.number().int().min(1) });

const logicIdSchema = z.string().trim().min(1).max(100);

type LogicRef = { endCustomerId: string; platform: string; name: string };

// Where a rule that is being written stands. It lives in this server's memory,
// so a restart forgets it and the page falls back to what the SDK lists.
type Progress = {
  stage: Extract<LogicStage, "writing" | "testing" | "ready" | "needs_change" | "not_built">;
  asked: string;
  summary: string | null;
  reason: string | null;
  test: LogicTest | null;
  startedAt: string;
};

const progressByLogic = new Map<string, Progress>();

const keyOf = (ref: LogicRef): string => [ref.endCustomerId, ref.platform, ref.name].join("\u0000");

const record = (ref: LogicRef, change: Partial<Progress>): void => {
  const before = progressByLogic.get(keyOf(ref));
  progressByLogic.set(keyOf(ref), {
    stage: "writing",
    asked: "",
    summary: null,
    reason: null,
    test: null,
    startedAt: new Date().toISOString(),
    ...before,
    ...change,
  });
};

// A sample record of the kind the rule runs on, for its one try. The try runs
// in a sandbox with no internet: nothing real is read or changed.
const SAMPLE_RECORDS: Record<SdkObject, JsonObject> = {
  contact: { record: { firstName: "Ada", lastName: "Lovelace", emails: [{ value: "ada@example.com", type: "work", primary: true }] } },
  company: { record: { name: "Riverside Supply", domain: "riverside.example" } },
  deal: { record: { name: "Annual plan", amount: 12000, currency: "USD" } },
};

const OBJECT_WORDS: Record<SdkObject, string> = { contact: "contact", company: "company", deal: "deal" };

// The record a rule runs on, read from its own file: the trigger names it.
const objectIn = (source: string): SdkObject | null => {
  const named = /object:\s*["'](contact|company|deal)["']/.exec(source)?.[1];
  return SDK_OBJECTS.find((object) => object === named) ?? null;
};

const testOf = (tried: TestLogicOutput, object: SdkObject): LogicTest => {
  const sample = `a sample ${OBJECT_WORDS[object]}`;
  const calls = tried.calls.map((call) => `${call.method} ${call.url}`);
  if (!tried.ran) return { passed: false, words: `It couldn't run on ${sample}: it doesn't pass its checks yet.`, calls };
  if (!tried.finished) return { passed: false, words: `It started on ${sample} but didn't finish.`, calls };
  if (tried.error) return { passed: false, words: `It stopped on ${sample}: ${tried.error.message}`, calls };
  const made = calls.length === 0 ? "" : ` It would make ${calls.length} ${calls.length === 1 ? "call" : "calls"} to the platform.`;
  return { passed: true, words: `It worked on ${sample}.${made}`, calls };
};

const problemsInWords = (count: number): string => (count === 1 ? "It found one thing to fix." : `It found ${count} things to fix.`);

// Write the rule from their words, check it, and try it once on a sample
// record. `before` is the file as it was, so a run that changed nothing (the
// agent explains why instead) ends as not built rather than as a template.
const writeAndTest = async (ref: LogicRef, words: string, revision: number | undefined, before: string | null): Promise<void> => {
  record(ref, { stage: "writing", asked: words, summary: null, reason: null, test: null, startedAt: new Date().toISOString() });
  try {
    const edited = await appnigma.logic.edit({ ...ref, prompt: words, revision, requestedBy: ref.endCustomerId });
    if (!edited.saved || !edited.draft || edited.draft.source === before) {
      const reason = edited.summary ?? (edited.problems.length > 0 ? problemsInWords(edited.problems.length) : "It could not be written that way.");
      record(ref, { stage: "not_built", reason });
      return;
    }
    record(ref, { stage: "testing", summary: edited.summary });
    const { problems } = await appnigma.logic.check(ref);
    if (problems.length > 0) {
      record(ref, { stage: "needs_change", reason: `${problemsInWords(problems.length)} Ask for a change to fix it.` });
      return;
    }
    const object = objectIn(edited.draft.source);
    if (!object) {
      record(ref, { stage: "ready" });
      return;
    }
    const tried = await appnigma.logic.test({ ...ref, input: SAMPLE_RECORDS[object], requestedBy: ref.endCustomerId });
    const test = testOf(tried, object);
    record(ref, { stage: test.passed ? "ready" : "needs_change", test, reason: test.passed ? null : test.words });
  } catch (error) {
    record(ref, { stage: "not_built", reason: errorAnswerOf(error).message });
  }
};

// Words that say nothing about what a rule does, left out of its name.
const FILLER_WORDS = new Set(["a", "an", "the", "is", "are", "be", "it", "its", "our", "their", "of", "to", "into", "in", "on", "for", "and", "or", "when", "whenever", "if", "then", "before", "after", "this", "that", "each", "every", "any"]);

// "Put our Account tier into HubSpot's customer tier" becomes
// "put-account-tier-hubspot-customer", made unique among this workspace's names.
const nameFrom = (words: string, taken: string[]): string => {
  const meaningful = words
    .toLowerCase()
    .replace(/'s\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !FILLER_WORDS.has(word));
  const base = meaningful.slice(0, NAME_WORDS).join("-").slice(0, NAME_MAX_LENGTH).replace(/-+$/, "") || "custom-logic";
  if (!taken.includes(base)) return base;
  let suffix = 2;
  while (taken.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};

// One rule as the page shows it: the SDK's entry, with what this server knows
// about the run writing it.
const stageOf = (entry: LogicEntry | null, progress: Progress | undefined): LogicStage => {
  if (progress && (progress.stage === "writing" || progress.stage === "testing")) return progress.stage;
  if (entry?.status === "checking") return "going_live";
  if (entry?.hasDraft) return progress?.stage ?? "ready";
  if (entry?.status === "failed") return "failed";
  if (entry?.status === "live") return "live";
  return progress?.stage ?? "ready";
};

const itemOf = (name: string, entry: LogicEntry | null, progress: Progress | undefined): CustomLogicItem => {
  const stage = stageOf(entry, progress);
  return {
    name,
    asked: progress?.asked ?? null,
    summary: progress?.summary ?? null,
    description: entry?.description ?? null,
    stage,
    reason: stage === "failed" ? (entry?.failure?.reason ?? null) : (progress?.reason ?? null),
    test: progress?.test ?? null,
    hasDraft: entry?.hasDraft ?? false,
    alwaysOn: entry?.alwaysOn ?? false,
    on: entry?.on ?? false,
    logicId: entry?.logicId ?? null,
    version: entry?.version ?? null,
    startedAt: progress?.startedAt ?? null,
  };
};

const refOf = (request: Request): LogicRef => ({
  endCustomerId: signedInWorkspace(),
  platform: platformSchema.parse(request.params.platform),
  name: nameSchema.parse(request.params.name),
});

const platformOf = (request: Request): string => platformSchema.parse(request.params.platform);

// Mounted at /api/integrations/:platform/logic.
const customLogicRouter = Router({ mergeParams: true });

customLogicRouter.use(requireSignedIn);

// The workspace's rules on this integration, newest first.
customLogicRouter.get(
  "/",
  route(async (request, response) => {
    const platform = platformOf(request);
    const endCustomerId = signedInWorkspace();
    const { logic, folderProblems } = await appnigma.logic.list({ endCustomerId });
    const entries = logic.filter((entry) => entry.platform === platform);
    const listed = entries.map((entry) => itemOf(entry.name, entry, progressByLogic.get(keyOf({ endCustomerId, platform, name: entry.name }))));
    const unlisted = [...progressByLogic.entries()]
      .map(([key, progress]) => ({ name: key.split("\u0000")[2] ?? "", key, progress }))
      .filter(({ key, name }) => key === keyOf({ endCustomerId, platform, name }) && !entries.some((entry) => entry.name === name))
      .map(({ name, progress }) => itemOf(name, null, progress));
    const items = [...unlisted, ...listed].sort((first, second) => (second.startedAt ?? "").localeCompare(first.startedAt ?? ""));
    const list: CustomLogicList = { logic: items, heldBack: folderProblems.map((problem) => problem.reason) };
    response.json(list);
  }),
);

// A new rule: made from the template around one CRM call, then written from
// their words in the background. The page reads where it is from the list.
customLogicRouter.post(
  "/",
  route(async (request, response) => {
    const ask = newLogicSchema.parse(request.body);
    const endCustomerId = signedInWorkspace();
    const platform = platformOf(request);
    const { logic } = await appnigma.logic.list({ endCustomerId });
    const name = nameFrom(ask.request, logic.filter((entry) => entry.platform === platform).map((entry) => entry.name));
    const ref = { endCustomerId, platform, name };
    const created = await appnigma.logic.create({ ...ref, trigger: { object: ask.object, operation: ask.operation, timing: ask.timing } });
    void writeAndTest(ref, ask.request, created.draft.revision, created.draft.source);
    response.status(202).json({ name });
  }),
);

// An always-on rule has an on and off switch per workspace; nothing is pushed,
// the next call reads it.
customLogicRouter.post(
  "/by-id/:logicId/switch",
  route(async (request, response) => {
    const logicId = logicIdSchema.parse(request.params.logicId);
    const { on } = z.object({ on: z.boolean() }).parse(request.body);
    const endCustomerId = signedInWorkspace();
    const switched = on ? await appnigma.logic.switchOn({ logicId, endCustomerId }) : await appnigma.logic.switchOff({ logicId, endCustomerId });
    const answer: CustomLogicSwitch = { on: switched.on, runs: switched.runs };
    response.json(answer);
  }),
);

// What it did on its last calls: outcomes and codes only, never the data it saw.
customLogicRouter.get(
  "/by-id/:logicId/runs",
  route(async (request, response) => {
    const logicId = logicIdSchema.parse(request.params.logicId);
    const { runs } = await appnigma.logic.runs({ logicId, endCustomerId: signedInWorkspace(), limit: RUNS_PAGE_SIZE });
    const answer: CustomLogicRuns = { runs };
    response.json(answer);
  }),
);

customLogicRouter.get(
  "/:name",
  route(async (request, response) => {
    const ref = refOf(request);
    const opened = await appnigma.logic.get(ref);
    const detail: CustomLogicDetail = {
      item: itemOf(ref.name, opened.entry, progressByLogic.get(keyOf(ref))),
      liveCode: opened.file?.source ?? null,
      liveCodeSha: opened.file?.sha ?? null,
      draft: opened.draft
        ? { code: opened.draft.source, revision: opened.draft.revision, updatedAt: opened.draft.updatedAt, goingLive: opened.draft.goingLiveRevision !== null }
        : null,
    };
    response.json(detail);
  }),
);

// A change in plain words: written from the waiting change, or from what is
// live, then checked and tried again, in the background like a new rule.
customLogicRouter.post(
  "/:name/change",
  route(async (request, response) => {
    const ref = refOf(request);
    const { request: words } = z.object({ request: wordsSchema }).parse(request.body);
    const opened = await appnigma.logic.get(ref);
    void writeAndTest(ref, words, opened.draft?.revision, opened.draft?.source ?? opened.file?.source ?? null);
    response.status(202).json({ name: ref.name });
  }),
);

// Saving the code by hand, from View code: on the draft's revision, or 0 with
// the live file's sha for the first change to what is live.
customLogicRouter.put(
  "/:name/code",
  route(async (request, response) => {
    const ref = refOf(request);
    const { code, revision, liveCodeSha } = codeSchema.parse(request.body);
    const saved = await appnigma.logic.update({ ...ref, source: code, revision, ...(revision === 0 && liveCodeSha ? { baseSha: liveCodeSha } : {}) });
    progressByLogic.delete(keyOf(ref));
    response.json({ revision: saved.revision });
  }),
);

customLogicRouter.post(
  "/:name/go-live",
  route(async (request, response) => {
    const ref = refOf(request);
    const { revision } = revisionSchema.parse(request.body);
    const going = await appnigma.logic.goLive({ ...ref, revision });
    response.json({ platform: going.platform, name: going.name, state: going.state });
  }),
);

customLogicRouter.get(
  "/:name/go-live",
  route(async (request, response) => {
    response.json(await appnigma.logic.goLiveStatus(refOf(request)));
  }),
);

// Throwing away the waiting change: what is live stays as it is.
customLogicRouter.post(
  "/:name/discard",
  route(async (request, response) => {
    const ref = refOf(request);
    const { revision } = revisionSchema.parse(request.body);
    await appnigma.logic.discard({ ...ref, revision });
    progressByLogic.delete(keyOf(ref));
    response.json({ discarded: true });
  }),
);

export { customLogicRouter };
