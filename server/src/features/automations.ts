import { SDK_OBJECTS } from "@appnigma/sdk";
import type { TestLogicOutput } from "@appnigma/sdk";
import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { route } from "../errors.js";
import { jsonObjectSchema, platformSchema } from "../inputs.js";
import { requireSignedIn, signedInWorkspace } from "../session.js";
import type { AutomationChange, AutomationCheck, AutomationDetail, AutomationList, AutomationRuns, AutomationSwitch, AutomationTrial } from "../types.js";

// Automations are the workspace's own custom logic: small pieces of code that
// run around its integration calls. Every call names the workspace as
// endCustomerId, so each workspace only ever sees and changes its own.

// The server takes up to 64 characters; a shorter limit keeps names readable.
const NAME_MAX_LENGTH = 60;
const REQUEST_MAX_LENGTH = 4000;
const CODE_MAX_LENGTH = 50_000;
const RUNS_PAGE_SIZE = 20;

const nameSchema = z
  .string()
  .trim()
  .max(NAME_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "should be lower case words with dashes between them, such as round-deal-amounts");

const refSchema = z.object({ platform: platformSchema, name: nameSchema });

const wordsSchema = z.string().trim().min(1, "should say what it should do").max(REQUEST_MAX_LENGTH);

const newAutomationSchema = z.object({
  platform: platformSchema,
  name: nameSchema,
  object: z.enum(SDK_OBJECTS),
  // What an automation can run around, as the logic screen offers it.
  operation: z.enum(["read", "write"]),
  timing: z.enum(["before", "after"]),
  request: wordsSchema,
});

const editSchema = z.object({ request: wordsSchema, revision: z.number().int().min(0).optional() });

const codeSchema = z.object({
  code: z.string().max(CODE_MAX_LENGTH),
  revision: z.number().int().min(0),
  liveCodeSha: z.string().regex(/^[0-9a-f]{40}$/).optional(),
});

const revisionSchema = z.object({ revision: z.number().int().min(1) });

const logicIdSchema = z.string().trim().min(1).max(100);

// The automation the path names, for the signed-in workspace only.
const refOf = (request: Request): { endCustomerId: string; platform: string; name: string } => ({ endCustomerId: signedInWorkspace(), ...refSchema.parse(request.params) });

// Asking in plain words: edit writes the change, from the draft or else what
// is live, and saves it as a draft only when it passes the checks.
const changeAutomation = async (ref: { endCustomerId: string; platform: string; name: string }, words: string, revision?: number): Promise<AutomationChange> => {
  const edited = await appnigma.logic.edit({ ...ref, prompt: words, revision, requestedBy: ref.endCustomerId });
  return { saved: edited.saved, summary: edited.summary, problems: edited.problems, revision: edited.draft?.revision ?? null };
};

const trialSummaryOf = (tried: TestLogicOutput): Pick<AutomationTrial, "outcome" | "summary"> => {
  if (!tried.ran) return { outcome: "did_not_build", summary: "It could not run yet: it does not pass the checks." };
  if (!tried.finished) return { outcome: "no_answer", summary: "It started but gave no answer." };
  if (tried.error) return { outcome: "failed", summary: `It stopped with: ${tried.error.message}` };
  const calls = tried.calls.length;
  return { outcome: "answered", summary: calls === 0 ? "It ran and answered without calling anything." : `It ran and would make ${calls} ${calls === 1 ? "call" : "calls"}.` };
};

const automationsRouter = Router();

automationsRouter.use(requireSignedIn);

automationsRouter.get(
  "/",
  route(async (_request, response) => {
    const { logic, folderProblems } = await appnigma.logic.list({ endCustomerId: signedInWorkspace() });
    const list: AutomationList = { automations: logic, heldBack: folderProblems.map((problem) => problem.reason) };
    response.json(list);
  }),
);

// A new automation starts from the template around one CRM call, then the
// workspace's own words write it.
automationsRouter.post(
  "/",
  route(async (request, response) => {
    const automation = newAutomationSchema.parse(request.body);
    const ref = { endCustomerId: signedInWorkspace(), platform: automation.platform, name: automation.name };
    const created = await appnigma.logic.create({ ...ref, trigger: { object: automation.object, operation: automation.operation, timing: automation.timing } });
    response.status(201).json(await changeAutomation(ref, automation.request, created.draft.revision));
  }),
);

// The hosted automation editor, for one workspace. Each link works once.
automationsRouter.post(
  "/editor-link",
  route(async (_request, response) => {
    const link = await appnigma.portal.createLink({ endCustomerId: signedInWorkspace() });
    response.json({ url: link.url });
  }),
);

// An always-on automation has a switch per workspace; nothing is pushed, the
// next call reads it.
automationsRouter.post(
  "/by-id/:logicId/switch",
  route(async (request, response) => {
    const logicId = logicIdSchema.parse(request.params.logicId);
    const { on } = z.object({ on: z.boolean() }).parse(request.body);
    const endCustomerId = signedInWorkspace();
    const switched = on ? await appnigma.logic.switchOn({ logicId, endCustomerId }) : await appnigma.logic.switchOff({ logicId, endCustomerId });
    const answer: AutomationSwitch = { on: switched.on, runs: switched.runs };
    response.json(answer);
  }),
);

automationsRouter.get(
  "/by-id/:logicId/runs",
  route(async (request, response) => {
    const logicId = logicIdSchema.parse(request.params.logicId);
    const { runs } = await appnigma.logic.runs({ logicId, endCustomerId: signedInWorkspace(), limit: RUNS_PAGE_SIZE });
    const answer: AutomationRuns = { runs };
    response.json(answer);
  }),
);

automationsRouter.get(
  "/:platform/:name",
  route(async (request, response) => {
    const opened = await appnigma.logic.get(refOf(request));
    const detail: AutomationDetail = {
      platform: opened.platform,
      name: opened.name,
      entry: opened.entry,
      liveCode: opened.file?.source ?? null,
      liveCodeSha: opened.file?.sha ?? null,
      draft: opened.draft
        ? { code: opened.draft.source, revision: opened.draft.revision, updatedAt: opened.draft.updatedAt, goingLive: opened.draft.goingLiveRevision !== null }
        : null,
    };
    response.json(detail);
  }),
);

automationsRouter.post(
  "/:platform/:name/change",
  route(async (request, response) => {
    const ref = refOf(request);
    const { request: words, revision } = editSchema.parse(request.body);
    response.json(await changeAutomation(ref, words, revision));
  }),
);

// Saving the code by hand, from View code: on the draft's revision, or 0 with
// the live file's sha for the first change to what is live.
automationsRouter.put(
  "/:platform/:name/code",
  route(async (request, response) => {
    const ref = refOf(request);
    const { code, revision, liveCodeSha } = codeSchema.parse(request.body);
    const saved = await appnigma.logic.update({ ...ref, source: code, revision, ...(revision === 0 && liveCodeSha ? { baseSha: liveCodeSha } : {}) });
    response.json({ revision: saved.revision });
  }),
);

automationsRouter.post(
  "/:platform/:name/check",
  route(async (request, response) => {
    const { problems } = await appnigma.logic.check(refOf(request));
    const check: AutomationCheck = { ready: problems.length === 0, problems };
    response.json(check);
  }),
);

// Trying it once on a sample, in a sandbox with no internet: every call it
// would make is written down and answered empty, so nothing real changes.
automationsRouter.post(
  "/:platform/:name/try",
  route(async (request, response) => {
    const ref = refOf(request);
    const { input } = z.object({ input: jsonObjectSchema }).parse(request.body);
    const tried = await appnigma.logic.test({ ...ref, input, requestedBy: ref.endCustomerId });
    const trial: AutomationTrial = { ...trialSummaryOf(tried), output: tried.output, calls: tried.calls.map((call) => `${call.method} ${call.url}`), problems: tried.problems };
    response.json(trial);
  }),
);

automationsRouter.post(
  "/:platform/:name/go-live",
  route(async (request, response) => {
    const ref = refOf(request);
    const { revision } = revisionSchema.parse(request.body);
    const going = await appnigma.logic.goLive({ ...ref, revision });
    response.json({ platform: going.platform, name: going.name, state: going.state });
  }),
);

automationsRouter.get(
  "/:platform/:name/go-live",
  route(async (request, response) => {
    response.json(await appnigma.logic.goLiveStatus(refOf(request)));
  }),
);

automationsRouter.post(
  "/:platform/:name/discard",
  route(async (request, response) => {
    const ref = refOf(request);
    const { revision } = revisionSchema.parse(request.body);
    await appnigma.logic.discard({ ...ref, revision });
    response.json({ discarded: true });
  }),
);

export { automationsRouter };
