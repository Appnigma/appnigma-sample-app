import type { CrmCompany, CrmContact, CrmDeal } from "@appnigma/sdk";
import { CRM_PAGE_SIZE, DEAL_MATCH_KEY_PREFIX } from "../constants/crm.js";
import { appnigma } from "../lib/appnigma.js";
import { errorAnswerOf } from "../lib/error-answer.js";
import type { CustomerOverview, CustomerRecord, NewCompany, NewContact, NewDeal, RecordEdit, RecordKind } from "../types/customer.types.js";
import type { Integration } from "../types/integration.types.js";
import { connectedCrmsOf, listIntegrations } from "./integrations.service.js";

// The CRM this customer connected. HubSpot, Attio, Pipedrive and the rest all
// answer in the same shape, so the code below never asks which one it is.
const connectedCrmOf = async (endCustomerId: string): Promise<Integration | null> => connectedCrmsOf(await listIntegrations(endCustomerId))[0] ?? null;

// A list the CRM refused: nothing in it, and why in plain words for the page.
const recordsOf = <RecordShape>(read: PromiseSettledResult<{ records: RecordShape[] }>, kind: RecordKind, problems: Partial<Record<RecordKind, string>>): RecordShape[] => {
  if (read.status === "fulfilled") return read.value.records;
  const { message, log } = errorAnswerOf(read.reason);
  if (log) console.error(log);
  problems[kind] = message;
  return [];
};

const customerOverview = async (endCustomerId: string): Promise<CustomerOverview> => {
  const crm = await connectedCrmOf(endCustomerId);
  if (!crm) return { platform: null, platformLabel: null, companies: [], contacts: [], deals: [], problems: {} };
  const platform = crm.platform;
  const [companies, contacts, deals] = await Promise.allSettled([
    appnigma.crm.companies.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
    appnigma.crm.contacts.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
    appnigma.crm.deals.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
  ]);
  const problems: Partial<Record<RecordKind, string>> = {};
  return {
    platform,
    platformLabel: crm.label,
    companies: recordsOf(companies, "companies", problems),
    contacts: recordsOf(contacts, "contacts", problems),
    deals: recordsOf(deals, "deals", problems),
    problems,
  };
};

// One record, read fresh from the CRM when someone opens it.
const customerRecord = async (endCustomerId: string, platform: string, kind: RecordKind, id: string): Promise<CustomerRecord> => {
  const input = { endCustomerId, platform, id };
  if (kind === "contacts") return { kind, record: (await appnigma.crm.contacts.get(input)).record };
  if (kind === "companies") return { kind, record: (await appnigma.crm.companies.get(input)).record };
  return { kind, record: (await appnigma.crm.deals.get(input)).record };
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

// A company is matched on its domain the same way.
const addCompany = async (endCustomerId: string, platform: string, company: NewCompany): Promise<CrmCompany> => {
  const { record } = await appnigma.crm.companies.create({ endCustomerId, platform, record: { name: company.name, domain: company.domain } });
  return record;
};

// No field of a deal is unique on every CRM, so a deal names a matchKey of
// this app's own: the same key updates the same deal instead of adding one.
const addDeal = async (endCustomerId: string, platform: string, deal: NewDeal): Promise<CrmDeal> => {
  const { record } = await appnigma.crm.deals.create({
    endCustomerId,
    platform,
    matchKey: `${DEAL_MATCH_KEY_PREFIX}${deal.name.toLowerCase()}`,
    record: { name: deal.name, amount: deal.amount ?? null, closeDate: deal.closeDate ?? null, companyId: deal.companyId ?? null },
  });
  return record;
};

// An update sends only the fields this app lets people change; a phone left
// empty is left as it is.
const updateCustomerRecord = async (endCustomerId: string, id: string, edit: RecordEdit): Promise<CustomerRecord> => {
  const target = { endCustomerId, platform: edit.platform, id };
  if (edit.kind === "contacts") {
    const phones = edit.phone ? { phones: [{ value: edit.phone, type: "work" as const, primary: true }] } : {};
    const { record } = await appnigma.crm.contacts.update({
      ...target,
      record: { firstName: edit.firstName, lastName: edit.lastName, emails: [{ value: edit.email, type: "work", primary: true }], ...phones },
    });
    return { kind: edit.kind, record };
  }
  if (edit.kind === "companies") {
    const { record } = await appnigma.crm.companies.update({ ...target, record: { name: edit.name, domain: edit.domain || null } });
    return { kind: edit.kind, record };
  }
  const { record } = await appnigma.crm.deals.update({ ...target, record: { name: edit.name, amount: edit.amount, closeDate: edit.closeDate } });
  return { kind: edit.kind, record };
};

export { addCompany, addContact, addDeal, customerOverview, customerRecord, updateCustomerRecord };
