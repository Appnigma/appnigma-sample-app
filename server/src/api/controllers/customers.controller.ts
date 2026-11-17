import type { Request, Response } from "express";
import { newContactSchema } from "../../schemas/request.schemas.js";
import { addContact, customerOverview } from "../../services/customers.service.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

const customerOverviewController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await customerOverview(signedInSession().endCustomerId));
  } catch (error) {
    respondWithError(response, error);
  }
};

const addContactController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { platform, ...contact } = newContactSchema.parse(request.body);
    response.status(201).json({ contact: await addContact(signedInSession().endCustomerId, platform, contact) });
  } catch (error) {
    respondWithError(response, error);
  }
};

export { addContactController, customerOverviewController };
