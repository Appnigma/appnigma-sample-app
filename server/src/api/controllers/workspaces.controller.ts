import type { Request, Response } from "express";
import { workspaceRemovalSchema, workspacesQuerySchema } from "../../schemas/request.schemas.js";
import { listWorkspaces, removeWorkspace } from "../../services/workspaces.service.js";
import { respondWithError } from "./respond.js";

const listWorkspacesController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { cursor } = workspacesQuerySchema.parse(request.query);
    response.json(await listWorkspaces(cursor));
  } catch (error) {
    respondWithError(response, error);
  }
};

const removeWorkspaceController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { endCustomerId } = workspaceRemovalSchema.parse(request.body);
    response.json(await removeWorkspace(endCustomerId));
  } catch (error) {
    respondWithError(response, error);
  }
};

export { listWorkspacesController, removeWorkspaceController };
