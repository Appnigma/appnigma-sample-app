import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { connectFieldsSchema, platformParamSchema } from "../../schemas/request.schemas.js";
import { recentChanges } from "../../services/changes.service.js";
import { connectWithDetails, disconnectIntegration, integrationDetail, listIntegrations, platformActions, startConnecting } from "../../services/integrations.service.js";
import { connectedAccountOf } from "../../services/platform-account.service.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

const listIntegrationsController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json({ integrations: await listIntegrations(signedInSession().endCustomerId) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const integrationController = async (request: Request, response: Response): Promise<void> => {
  try {
    const platform = platformParamSchema.parse(request.params.platform);
    response.json({ integration: await integrationDetail(signedInSession().endCustomerId, platform) });
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

const connectWithDetailsController = async (request: Request, response: Response): Promise<void> => {
  try {
    const platform = platformParamSchema.parse(request.params.platform);
    const { fields } = connectFieldsSchema.parse(request.body);
    response.json({ status: await connectWithDetails(signedInSession().endCustomerId, platform, fields) });
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

const accountController = async (request: Request, response: Response): Promise<void> => {
  try {
    const platform = platformParamSchema.parse(request.params.platform);
    response.json({ account: await connectedAccountOf(signedInSession().endCustomerId, platform) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const actionsController = async (request: Request, response: Response): Promise<void> => {
  try {
    response.json({ actions: await platformActions(platformParamSchema.parse(request.params.platform)) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const changesController = async (request: Request, response: Response): Promise<void> => {
  try {
    const platform = platformParamSchema.parse(request.params.platform);
    response.json(await recentChanges(signedInSession().endCustomerId, platform));
  } catch (error) {
    respondWithError(response, error);
  }
};

export {
  accountController,
  actionsController,
  changesController,
  connectController,
  connectWithDetailsController,
  disconnectController,
  integrationController,
  listIntegrationsController,
};
