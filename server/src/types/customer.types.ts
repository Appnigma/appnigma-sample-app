import type { CrmCompany, CrmContact, CrmDeal } from "@appnigma/sdk";
import type { z } from "zod";
import type { newCompanySchema, newContactSchema, newDealSchema, recordEditSchema, recordKindSchema } from "../schemas/request.schemas.js";

// Each list is read on its own: one the CRM refuses comes back empty, with why
// in plain words under problems, and the others still show.
type CustomerOverview = {
  platform: string | null;
  platformLabel: string | null;
  companies: CrmCompany[];
  contacts: CrmContact[];
  deals: CrmDeal[];
  problems: Partial<Record<RecordKind, string>>;
};

type NewContact = Omit<z.infer<typeof newContactSchema>, "platform">;

type NewCompany = Omit<z.infer<typeof newCompanySchema>, "platform">;

type NewDeal = Omit<z.infer<typeof newDealSchema>, "platform">;

type RecordKind = z.infer<typeof recordKindSchema>;

type RecordEdit = z.infer<typeof recordEditSchema>;

type CustomerRecord = { kind: "contacts"; record: CrmContact } | { kind: "companies"; record: CrmCompany } | { kind: "deals"; record: CrmDeal };

export type { CustomerOverview, CustomerRecord, NewCompany, NewContact, NewDeal, RecordEdit, RecordKind };
