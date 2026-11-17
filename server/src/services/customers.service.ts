import type { CrmContact } from "@appnigma/sdk";
import { CRM_PAGE_SIZE } from "../constants/crm.js";
import { appnigma } from "../lib/appnigma.js";
import type { CustomerOverview, NewContact } from "../types/customer.types.js";
import type { Integration } from "../types/integration.types.js";
import { listIntegrations } from "./integrations.service.js";

// The first CRM this customer connected. HubSpot, Attio, Pipedrive and the
// rest all answer in the same shape, so the code below never asks which one it is.
const connectedCrmOf = async (endCustomerId: string): Promise<Integration | null> => {
  const integrations = await listIntegrations(endCustomerId);
  return integrations.find((integration) => integration.hasCrmData && integration.status === "connected") ?? null;
};

const customerOverview = async (endCustomerId: string): Promise<CustomerOverview> => {
  const crm = await connectedCrmOf(endCustomerId);
  if (!crm) return { platform: null, platformLabel: null, companies: [], contacts: [], deals: [] };
  const platform = crm.platform;
  const [companies, contacts, deals] = await Promise.all([
    appnigma.crm.companies.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
    appnigma.crm.contacts.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
    appnigma.crm.deals.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
  ]);
  return { platform, platformLabel: crm.label, companies: companies.records, contacts: contacts.records, deals: deals.records };
};

// A create with an email updates the contact that already has it, so sending
// the same contact twice never makes a duplicate.
const addContact = async (endCustomerId: string, platform: string, contact: NewContact): Promise<CrmContact> => {
  const { record } = await appnigma.crm.contacts.create({
    endCustomerId,
    platform,
    record: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      emails: [{ value: contact.email, type: "work", primary: true }],
    },
  });
  return record;
};

export { addContact, customerOverview };
