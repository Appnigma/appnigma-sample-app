import { Router } from "express";
import { z } from "zod";
import { appnigma } from "../appnigma.js";
import { errorAnswerOf, route } from "../errors.js";
import { platformSchema } from "../inputs.js";
import { requireSignedIn, signedInWorkspace } from "../session.js";
import type { CustomerOverview, CustomerRecord, RecordKind } from "../types.js";
import { connectedCrmsOf, listIntegrations } from "./integrations.js";

// The Customers page: the companies, contacts and deals in the CRM this
// customer connected. HubSpot, Attio, Pipedrive and the rest all answer in the
// same shape, so the code below never asks which one it is.

// Enough for a small account in one page; the SDK takes up to 100.
const CRM_PAGE_SIZE = 50;

// A deal create names a key of this app's own, so sending it again updates the same deal.
const DEAL_MATCH_KEY_PREFIX = "acme-desk-deal:";

const recordKindSchema = z.enum(["contacts", "companies", "deals"]);

const recordIdSchema = z.string().trim().min(1).max(200);

const closeDateSchema = z.iso.date();

const newContactSchema = z.object({
  platform: platformSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
});

const newCompanySchema = z.object({
  platform: platformSchema,
  name: z.string().trim().min(1).max(120),
  domain: z.string().trim().min(3).max(120),
});

const newDealSchema = z.object({
  platform: platformSchema,
  name: z.string().trim().min(1).max(120),
  amount: z.number().nonnegative().max(1_000_000_000).optional(),
  closeDate: closeDateSchema.optional(),
  companyId: z.string().trim().min(1).max(200).optional(),
});

const recordEditSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("contacts"),
    platform: platformSchema,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email(),
    phone: z.string().trim().max(40).optional(),
  }),
  z.object({
    kind: z.literal("companies"),
    platform: platformSchema,
    name: z.string().trim().min(1).max(120),
    domain: z.string().trim().max(120).optional(),
  }),
  z.object({
    kind: z.literal("deals"),
    platform: platformSchema,
    name: z.string().trim().min(1).max(120),
    amount: z.number().nonnegative().max(1_000_000_000).nullable(),
    closeDate: closeDateSchema.nullable(),
  }),
]);

// A list the CRM refused: nothing in it, and why in plain words for the page.
const recordsOf = <RecordShape>(read: PromiseSettledResult<{ records: RecordShape[] }>, kind: RecordKind, problems: Partial<Record<RecordKind, string>>): RecordShape[] => {
  if (read.status === "fulfilled") return read.value.records;
  const { message, log } = errorAnswerOf(read.reason);
  if (log) console.error(log);
  problems[kind] = message;
  return [];
};

const customersRouter = Router();

customersRouter.use(requireSignedIn);

// Each list is read on its own, so one the CRM refuses doesn't hide the others.
customersRouter.get(
  "/",
  route(async (_request, response) => {
    const endCustomerId = signedInWorkspace();
    const crm = connectedCrmsOf(await listIntegrations(endCustomerId))[0] ?? null;
    if (!crm) {
      const empty: CustomerOverview = { platform: null, platformLabel: null, companies: [], contacts: [], deals: [], problems: {} };
      response.json(empty);
      return;
    }
    const platform = crm.platform;
    const [companies, contacts, deals] = await Promise.allSettled([
      appnigma.crm.companies.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
      appnigma.crm.contacts.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
      appnigma.crm.deals.list({ endCustomerId, platform, limit: CRM_PAGE_SIZE }),
    ]);
    const problems: Partial<Record<RecordKind, string>> = {};
    const overview: CustomerOverview = {
      platform,
      platformLabel: crm.label,
      companies: recordsOf(companies, "companies", problems),
      contacts: recordsOf(contacts, "contacts", problems),
      deals: recordsOf(deals, "deals", problems),
      problems,
    };
    response.json(overview);
  }),
);

// A create with an email updates the contact that already has it, so sending
// the same contact twice never makes a duplicate.
customersRouter.post(
  "/contacts",
  route(async (request, response) => {
    const { platform, firstName, lastName, email } = newContactSchema.parse(request.body);
    const { record } = await appnigma.crm.contacts.create({
      endCustomerId: signedInWorkspace(),
      platform,
      record: { firstName, lastName, emails: [{ value: email, type: "work", primary: true }] },
    });
    response.status(201).json({ contact: record });
  }),
);

// A company is matched on its domain the same way.
customersRouter.post(
  "/companies",
  route(async (request, response) => {
    const { platform, name, domain } = newCompanySchema.parse(request.body);
    const { record } = await appnigma.crm.companies.create({ endCustomerId: signedInWorkspace(), platform, record: { name, domain } });
    response.status(201).json({ company: record });
  }),
);

// No field of a deal is unique on every CRM, so a deal names a matchKey of
// this app's own: the same key updates the same deal instead of adding one.
customersRouter.post(
  "/deals",
  route(async (request, response) => {
    const { platform, ...deal } = newDealSchema.parse(request.body);
    const { record } = await appnigma.crm.deals.create({
      endCustomerId: signedInWorkspace(),
      platform,
      matchKey: `${DEAL_MATCH_KEY_PREFIX}${deal.name.toLowerCase()}`,
      record: { name: deal.name, amount: deal.amount ?? null, closeDate: deal.closeDate ?? null, companyId: deal.companyId ?? null },
    });
    response.status(201).json({ deal: record });
  }),
);

// One record, read fresh from the CRM when someone opens it.
customersRouter.get(
  "/:kind/:id",
  route(async (request, response) => {
    const kind = recordKindSchema.parse(request.params.kind);
    const id = recordIdSchema.parse(request.params.id);
    const { platform } = z.object({ platform: platformSchema }).parse(request.query);
    const input = { endCustomerId: signedInWorkspace(), platform, id };
    let opened: CustomerRecord;
    if (kind === "contacts") opened = { kind, record: (await appnigma.crm.contacts.get(input)).record };
    else if (kind === "companies") opened = { kind, record: (await appnigma.crm.companies.get(input)).record };
    else opened = { kind, record: (await appnigma.crm.deals.get(input)).record };
    response.json(opened);
  }),
);

// An update sends only the fields this app lets people change; a phone left
// empty is left as it is.
customersRouter.patch(
  "/:kind/:id",
  route(async (request, response) => {
    const id = recordIdSchema.parse(request.params.id);
    const edit = recordEditSchema.parse({ ...request.body, kind: request.params.kind });
    const target = { endCustomerId: signedInWorkspace(), platform: edit.platform, id };
    let updated: CustomerRecord;
    if (edit.kind === "contacts") {
      const phones = edit.phone ? { phones: [{ value: edit.phone, type: "work" as const, primary: true }] } : {};
      const { record } = await appnigma.crm.contacts.update({
        ...target,
        record: { firstName: edit.firstName, lastName: edit.lastName, emails: [{ value: edit.email, type: "work", primary: true }], ...phones },
      });
      updated = { kind: edit.kind, record };
    } else if (edit.kind === "companies") {
      const { record } = await appnigma.crm.companies.update({ ...target, record: { name: edit.name, domain: edit.domain || null } });
      updated = { kind: edit.kind, record };
    } else {
      // A close date goes only when one was entered: some CRMs (Attio) have none on a deal and refuse the field.
      const closeDate = edit.closeDate ? { closeDate: edit.closeDate } : {};
      const { record } = await appnigma.crm.deals.update({ ...target, record: { name: edit.name, amount: edit.amount, ...closeDate } });
      updated = { kind: edit.kind, record };
    }
    response.json(updated);
  }),
);

export { customersRouter };
