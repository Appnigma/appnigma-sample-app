import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { platformParamSchema } from "../../schemas/request.schemas.js";
import { disconnectIntegration, listIntegrations, startConnecting } from "../../services/integrations.service.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

const listIntegrationsController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json({ integrations: await listIntegrations(signedInSession().endCustomerId) });
  } catch (error) {
    respondWithError(response, error);
  }
};

// The platform's page in this app, reached through RETURN_PAGE_URL when one is set.
const returnAddressFor = (platform: string): string => {
  const ownAddress = `${env.publicUrl}/integrations/${platform}`;
  if (!env.returnPageUrl) return ownAddress;
  const returnPage = new URL(env.returnPageUrl);
  returnPage.searchParams.set("to", ownAddress);
  return returnPage.toString();
};

const connectController = async (request: Request, response: Response): Promise<void> => {
  try {
    const platform = platformParamSchema.parse(request.params.platform);
    response.json({ url: await startConnecting(signedInSession().endCustomerId, platform, returnAddressFor(platform)) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const disconnectController = async (request: Request, response: Response): Promise<void> => {
  try {
    await disconnectIntegration(signedInSession().endCustomerId, platformParamSchema.parse(request.params.platform));
    response.json({ disconnected: true });
  } catch (error) {
    respondWithError(response, error);
  }
};

export { connectController, disconnectController, listIntegrationsController };
