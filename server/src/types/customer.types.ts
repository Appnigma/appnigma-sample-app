import type { CrmCompany, CrmContact, CrmDeal } from "@appnigma/sdk";
import type { z } from "zod";
import type { newContactSchema } from "../schemas/request.schemas.js";

type CustomerOverview = {
  platform: string | null;
  platformLabel: string | null;
  companies: CrmCompany[];
  contacts: CrmContact[];
  deals: CrmDeal[];
};

type NewContact = Omit<z.infer<typeof newContactSchema>, "platform">;

export type { CustomerOverview, NewContact };
