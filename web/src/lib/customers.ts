import type { CustomerOverview } from "@server-types";
import type { RecentRecord, StageSummary } from "../types/ui.types";
import { isRecent } from "./format";

const recentRecordsOf = (overview: CustomerOverview): RecentRecord[] =>
  [
    ...overview.companies.map((company) => ({ id: company.id, kind: "company" as const, name: company.name ?? "Company", detail: company.domain ?? "", updatedAt: company.updatedAt })),
    ...overview.contacts.map((contact) => ({ id: contact.id, kind: "contact" as const, name: contact.fullName ?? "Contact", detail: contact.emails[0]?.value ?? "", updatedAt: contact.updatedAt })),
    ...overview.deals.map((deal) => ({ id: deal.id, kind: "deal" as const, name: deal.name ?? "Deal", detail: deal.stage?.label ?? "", updatedAt: deal.updatedAt })),
  ]
    .filter((record): record is RecentRecord => record.updatedAt !== null && isRecent(record.updatedAt))
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

const stagesOf = (overview: CustomerOverview): StageSummary[] => {
  const stages = new Map<string, StageSummary>();
  for (const deal of overview.deals.filter((candidate) => candidate.status === "open")) {
    const label = deal.stage?.label ?? "No stage";
    const current = stages.get(label) ?? { label, count: 0, amount: 0 };
    stages.set(label, { label, count: current.count + 1, amount: current.amount + (deal.amount ?? 0) });
  }
  return [...stages.values()].sort((first, second) => second.amount - first.amount);
};

const openPipelineOf = (overview: CustomerOverview): number =>
  overview.deals.filter((deal) => deal.status === "open").reduce((total, deal) => total + (deal.amount ?? 0), 0);

export { openPipelineOf, recentRecordsOf, stagesOf };
