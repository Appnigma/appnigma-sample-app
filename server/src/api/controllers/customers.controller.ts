import type { Request, Response } from "express";
import { newCompanySchema, newContactSchema, newDealSchema, platformQuerySchema, recordEditSchema, recordIdParamSchema, recordKindSchema } from "../../schemas/request.schemas.js";
import { addCompany, addContact, addDeal, customerOverview, customerRecord, updateCustomerRecord } from "../../services/customers.service.js";
import { respondWithError } from "./respond.js";
import { signedInSession } from "./session.js";

const customerOverviewController = async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await customerOverview(signedInSession().endCustomerId));
  } catch (error) {
    respondWithError(response, error);
  }
};

const customerRecordController = async (request: Request, response: Response): Promise<void> => {
  try {
    const kind = recordKindSchema.parse(request.params.kind);
    const id = recordIdParamSchema.parse(request.params.id);
    const { platform } = platformQuerySchema.parse(request.query);
    response.json(await customerRecord(signedInSession().endCustomerId, platform, kind, id));
  } catch (error) {
    respondWithError(response, error);
  }
};

const updateCustomerRecordController = async (request: Request, response: Response): Promise<void> => {
  try {
    const id = recordIdParamSchema.parse(request.params.id);
    const edit = recordEditSchema.parse({ ...request.body, kind: request.params.kind });
    response.json(await updateCustomerRecord(signedInSession().endCustomerId, id, edit));
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

const addCompanyController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { platform, ...company } = newCompanySchema.parse(request.body);
    response.status(201).json({ company: await addCompany(signedInSession().endCustomerId, platform, company) });
  } catch (error) {
    respondWithError(response, error);
  }
};

const addDealController = async (request: Request, response: Response): Promise<void> => {
  try {
    const { platform, ...deal } = newDealSchema.parse(request.body);
    response.status(201).json({ deal: await addDeal(signedInSession().endCustomerId, platform, deal) });
  } catch (error) {
    respondWithError(response, error);
  }
};

export { addCompanyController, addContactController, addDealController, customerOverviewController, customerRecordController, updateCustomerRecordController };
