import type { CustomerOverview, RecordKind } from "@server-types";
import { Building2, Plus, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import { api } from "../api/client";
import { AddRecordCard } from "../components/AddRecordCard";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { PlatformLogo } from "../components/PlatformLogo";
import { RecordPanel } from "../components/RecordPanel";
import { PageSkeleton } from "../components/Skeleton";
import { usePolling } from "../hooks/use-polling";
import { openPipelineOf, stagesOf } from "../lib/customers";
import { compactMoney, isRecent, money, timeAgo } from "../lib/format";
import type { OpenRecord } from "../types/ui.types";

const REFRESH_MS = 5000;

const TABS = ["Companies", "Contacts", "Deals"] as const;

const TAB_KINDS: Record<(typeof TABS)[number], RecordKind> = { Companies: "companies", Contacts: "contacts", Deals: "deals" };

const STAGE_COLORS = ["bg-brand", "bg-sky-400", "bg-emerald-400", "bg-amber-400", "bg-violet-400", "bg-rose-400"];

const DEAL_STATUS_STYLES: Record<"open" | "won" | "lost", string> = {
  open: "bg-sky-50 text-sky-700 ring-sky-600/20",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  lost: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const UpdatedBadge = ({ at }: { at: string | null }) =>
  isRecent(at) && at ? <span className="ml-2 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">Updated {timeAgo(at)}</span> : null;

const rowClass = (at: string | null): string => `cursor-pointer border-t border-slate-100 transition-colors ${isRecent(at) ? "bg-brand/[0.04]" : "hover:bg-slate-50/70"}`;

const PipelineSummary = ({ overview }: { overview: CustomerOverview }) => {
  const stages = stagesOf(overview);
  const total = openPipelineOf(overview);
  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="section-title">Open pipeline</h2>
        <p className="text-2xl font-semibold tracking-tight">{compactMoney(total)}</p>
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {stages.map((stage, index) => (
          <div key={stage.label} className={STAGE_COLORS[index % STAGE_COLORS.length]} style={{ width: `${total ? (stage.amount / total) * 100 : 0}%` }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {stages.map((stage, index) => (
          <span key={stage.label} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[index % STAGE_COLORS.length]}`} />
            {stage.label} · {stage.count} · {compactMoney(stage.amount)}
          </span>
        ))}
      </div>
    </section>
  );
};

// Your customers' own CRM data, inside your product. The same code works for
// Salesforce, HubSpot, Pipedrive and the rest: the shapes never change. Open a
// row to read it fresh and change it; add contacts, companies and deals.
const CustomersPage = () => {
  const load = useCallback(() => api.customers(), []);
  const { data: overview, error, reload } = usePolling(load, REFRESH_MS);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Companies");
  const [adding, setAdding] = useState(false);
  const [openRecord, setOpenRecord] = useState<OpenRecord | null>(null);

  if (error) return <EmptyState icon={<Users className="h-5 w-5" />} title="We could not load your customers" detail={error} />;
  if (!overview) return <PageSkeleton />;
  if (!overview.platform) {
    return (
      <EmptyState
        icon={<Building2 className="h-5 w-5" />}
        title="Bring in your customers"
        detail="Connect your CRM and your companies, contacts and deals show up here, kept in step automatically."
        action={
          <Link to="/integrations" className="button-primary">
            Connect your CRM
          </Link>
        }
      />
    );
  }

  const companyName = (companyId: string | null): string => overview.companies.find((company) => company.id === companyId)?.name ?? "—";
  const counts = { Companies: overview.companies.length, Contacts: overview.contacts.length, Deals: overview.deals.length };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle flex items-center gap-2">
            <PlatformLogo platform={overview.platform} label={overview.platformLabel ?? overview.platform} size="small" />
            Synced from {overview.platformLabel}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
          </p>
        </div>
        <button type="button" onClick={() => setAdding(!adding)} className="button-primary">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {adding && <AddRecordCard overview={overview} onClose={() => setAdding(false)} onAdded={reload} />}
      {openRecord && (
        <RecordPanel open={openRecord} platform={overview.platform} platformLabel={overview.platformLabel ?? overview.platform} onClose={() => setOpenRecord(null)} onSaved={reload} />
      )}

      <PipelineSummary overview={overview} />

      <section className="panel overflow-hidden">
        <div className="flex gap-1 border-b border-slate-100 px-3 pt-2">
          {TABS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setTab(candidate)}
              className={`-mb-px border-b-2 px-3 py-2.5 font-medium transition ${tab === candidate ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {candidate} <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-xs text-slate-500">{counts[candidate]}</span>
            </button>
          ))}
        </div>

        {overview.problems[TAB_KINDS[tab]] && (
          <p className="border-b border-slate-100 bg-amber-50 px-5 py-3 text-amber-800">
            {overview.platformLabel ?? "Your CRM"} didn't send your {TAB_KINDS[tab]}: {overview.problems[TAB_KINDS[tab]]}
          </p>
        )}

        {tab === "Companies" && (
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-2.5">Company</th>
                <th className="px-5 py-2.5">Domain</th>
                <th className="px-5 py-2.5">Contacts</th>
                <th className="px-5 py-2.5">Open deals</th>
              </tr>
            </thead>
            <tbody>
              {overview.companies.map((company) => {
                const open = overview.deals.filter((deal) => deal.companyId === company.id && deal.status === "open");
                return (
                  <tr key={company.id} className={rowClass(company.updatedAt)} onClick={() => setOpenRecord({ kind: "companies", id: company.id })}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3 font-medium">
                        <Avatar name={company.name ?? "?"} size="small" />
                        {company.name}
                        <UpdatedBadge at={company.updatedAt} />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{company.domain}</td>
                    <td className="px-5 py-3 text-slate-600">{overview.contacts.filter((contact) => contact.companyId === company.id).length}</td>
                    <td className="px-5 py-3">{open.length ? `${open.length} · ${money(open.reduce((total, deal) => total + (deal.amount ?? 0), 0))}` : <span className="text-slate-400">None</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === "Contacts" && (
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-2.5">Name</th>
                <th className="px-5 py-2.5">Email</th>
                <th className="px-5 py-2.5">Phone</th>
                <th className="px-5 py-2.5">Company</th>
              </tr>
            </thead>
            <tbody>
              {overview.contacts.map((contact) => (
                <tr key={contact.id} className={rowClass(contact.updatedAt)} onClick={() => setOpenRecord({ kind: "contacts", id: contact.id })}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3 font-medium">
                      <Avatar name={contact.fullName ?? "?"} size="small" />
                      {contact.fullName}
                      <UpdatedBadge at={contact.updatedAt} />
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{contact.emails[0]?.value ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{contact.phones[0]?.value ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{companyName(contact.companyId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "Deals" && (
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-2.5">Deal</th>
                <th className="px-5 py-2.5">Stage</th>
                <th className="px-5 py-2.5">Close date</th>
                <th className="px-5 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {overview.deals.map((deal) => (
                <tr key={deal.id} className={rowClass(deal.updatedAt)} onClick={() => setOpenRecord({ kind: "deals", id: deal.id })}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{deal.name}</span>
                    <UpdatedBadge at={deal.updatedAt} />
                    <span className="block text-xs text-slate-500">{companyName(deal.companyId)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${DEAL_STATUS_STYLES[deal.status ?? "open"]}`}>{deal.stage?.label ?? "No stage"}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{deal.closeDate ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold">{money(deal.amount, deal.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export { CustomersPage };
