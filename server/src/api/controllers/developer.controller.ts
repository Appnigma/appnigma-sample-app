import type { Request, Response } from "express";
import { functionRunSchema } from "../../schemas/request.schemas.js";
import { developerGuide, listFunctions, runFunction } from "../../services/developer.service.js";
import { respondWithError } from "./respond.js";

const listFunctionsController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await listFunctions());
  } catch (error) {
    respondWithError(response, error);
  }
};

const runFunctionController = async (request: Request, response: Response): Promise<void> => {
  try {
    response.json(await runFunction(functionRunSchema.parse(request.body)));
  } catch (error) {
    respondWithError(response, error);
  }
};

const developerGuideController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json({ guide: await developerGuide() });
  } catch (error) {
    respondWithError(response, error);
  }
};

export { developerGuideController, listFunctionsController, runFunctionController };
