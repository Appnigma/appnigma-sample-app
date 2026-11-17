import type { Request, Response } from "express";
import { callIdParamSchema } from "../../schemas/request.schemas.js";
import { callTranscript, listCalls } from "../../services/calls.service.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

const listCallsController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json({ calls: await listCalls(signedInSession().endCustomerId) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const transcriptController = async (request: Request, response: Response): Promise<void> => {
  try {
    const callId = callIdParamSchema.parse(request.params.callId);
    response.json({ transcript: await callTranscript(signedInSession().endCustomerId, callId) });
  } catch (error) {
    respondWithError(response, error);
  }
};

export { listCallsController, transcriptController };
