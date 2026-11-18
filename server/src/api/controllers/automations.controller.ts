import type { Request, Response } from "express";
import {
  automationCodeSchema,
  automationEditSchema,
  automationRefSchema,
  automationRevisionSchema,
  automationSwitchSchema,
  automationTrialSchema,
  logicIdParamSchema,
  newAutomationSchema,
} from "../../schemas/request.schemas.js";
import {
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
} from "../../services/automations.service.js";
import type { AutomationRef } from "../../types/automation.types.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

// The automation the path names, for the signed-in workspace only.
const automationRefOf = (request: Request): AutomationRef => ({ endCustomerId: signedInSession().endCustomerId, ...automationRefSchema.parse(request.params) });

const listAutomationsController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await listAutomations(signedInSession().endCustomerId));
  } catch (error) {
    respondWithError(response, error);
  }
};

const createAutomationController = async (request: Request, response: Response): Promise<void> => {
  try {
    const automation = newAutomationSchema.parse(request.body);
    response.status(201).json(await createAutomation(signedInSession().endCustomerId, automation));
  } catch (error) {
    respondWithError(response, error);
  }
};

const automationController = async (request: Request, response: Response): Promise<void> => {
  try {
    response.json(await automationDetail(automationRefOf(request)));
  } catch (error) {
    respondWithError(response, error);
  }
};

const changeAutomationController = async (request: Request, response: Response): Promise<void> => {
  try {
    const ref = automationRefOf(request);
    const { request: words, revision } = automationEditSchema.parse(request.body);
    response.json(await changeAutomation(ref, words, revision));
  } catch (error) {
    respondWithError(response, error);
  }
};

const saveAutomationCodeController = async (request: Request, response: Response): Promise<void> => {
  try {
    const ref = automationRefOf(request);
    const { code, revision, liveCodeSha } = automationCodeSchema.parse(request.body);
    response.json({ revision: await saveAutomationCode(ref, code, revision, liveCodeSha) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const checkAutomationController = async (request: Request, response: Response): Promise<void> => {
  try {
    response.json(await checkAutomation(automationRefOf(request)));
  } catch (error) {
    respondWithError(response, error);
  }
};

const tryAutomationController = async (request: Request, response: Response): Promise<void> => {
  try {
    const ref = automationRefOf(request);
    const { input } = automationTrialSchema.parse(request.body);
    response.json(await tryAutomation(ref, input));
  } catch (error) {
    respondWithError(response, error);
  }
};

const goLiveController = async (request: Request, response: Response): Promise<void> => {
  try {
    const ref = automationRefOf(request);
    const { revision } = automationRevisionSchema.parse(request.body);
    response.json(await putAutomationLive(ref, revision));
  } catch (error) {
    respondWithError(response, error);
  }
};

const goLiveProgressController = async (request: Request, response: Response): Promise<void> => {
  try {
    response.json(await goLiveProgress(automationRefOf(request)));
  } catch (error) {
    respondWithError(response, error);
  }
};

const throwAwayDraftController = async (request: Request, response: Response): Promise<void> => {
  try {
    const ref = automationRefOf(request);
    const { revision } = automationRevisionSchema.parse(request.body);
    await throwAwayDraft(ref, revision);
    response.json({ discarded: true });
  } catch (error) {
    respondWithError(response, error);
  }
};

const switchAutomationController = async (request: Request, response: Response): Promise<void> => {
  try {
    const logicId = logicIdParamSchema.parse(request.params.logicId);
    const { on } = automationSwitchSchema.parse(request.body);
    response.json(await switchAutomation(signedInSession().endCustomerId, logicId, on));
  } catch (error) {
    respondWithError(response, error);
  }
};

const automationRunsController = async (request: Request, response: Response): Promise<void> => {
  try {
    const logicId = logicIdParamSchema.parse(request.params.logicId);
    response.json(await automationRuns(signedInSession().endCustomerId, logicId));
  } catch (error) {
    respondWithError(response, error);
  }
};

const automationEditorLinkController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json({ url: await automationEditorLink(signedInSession().endCustomerId) });
  } catch (error) {
    respondWithError(response, error);
  }
};

export {
  automationController,
  automationEditorLinkController,
  automationRunsController,
  changeAutomationController,
  checkAutomationController,
  createAutomationController,
  goLiveController,
  goLiveProgressController,
  listAutomationsController,
  saveAutomationCodeController,
  switchAutomationController,
  throwAwayDraftController,
  tryAutomationController,
};
