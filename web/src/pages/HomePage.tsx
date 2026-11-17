import { ArrowRight, Blocks, Briefcase, Building2, CheckCircle2, Circle, Radio, UserRound, Users } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/Skeleton";
import { CALL_PLATFORM } from "../constants/platforms";
import { useApp } from "../hooks/app-context";
import { usePolling } from "../hooks/use-polling";
import { openPipelineOf, recentRecordsOf } from "../lib/customers";
import { compactMoney, greetingOf, timeAgo } from "../lib/format";
import { isDone } from "../lib/progress";
import type { ChecklistItem, RecentRecord } from "../types/ui.types";

const REFRESH_MS = 5000;

const KIND_ICONS: Record<RecentRecord["kind"], typeof Building2> = { company: Building2, contact: UserRound, deal: Briefcase };

const HomePage = () => {
  const { app } = useApp();
  const load = useCallback(async () => {
    const [overview, list] = await Promise.all([api.customers(), api.integrations()]);
    return { overview, integrations: list.integrations };
  }, []);
  const { data, error } = usePolling(load, REFRESH_MS);

  if (error) return <EmptyState icon={<Radio className="h-5 w-5" />} title="We could not load your workspace" detail={error} />;
  if (!data) return <PageSkeleton />;

  const { overview, integrations } = data;
  const crm = integrations.find((integration) => integration.hasCrmData && integration.status === "connected");
  const gongConnected = integrations.some((integration) => integration.platform === CALL_PLATFORM && integration.status === "connected");
  const connected = integrations.filter((integration) => integration.status === "connected").length;
  const recent = recentRecordsOf(overview);
  const checklist: ChecklistItem[] = [
    { title: "Connect your CRM", detail: "Bring in your companies, contacts and deals.", done: crm !== undefined, to: "/integrations" },
    { title: "Add a contact", detail: `Add one here and it shows up in ${crm?.label ?? "your CRM"}.`, done: crm !== undefined && isDone("contact"), to: "/customers" },
    ...(app.callsAvailable
      ? [{ title: "Read a recorded call", detail: "Connect Gong and see transcripts here.", done: gongConnected && isDone("calls"), to: gongConnected ? "/calls" : "/integrations" }]
      : []),
  ];
  const finished = checklist.filter((item) => item.done).length;
  const kpis = [
    { label: "Companies", value: String(overview.companies.length), icon: Building2 },
    { label: "Open pipeline", value: compactMoney(openPipelineOf(overview)), icon: Briefcase },
    { label: "Contacts", value: String(overview.contacts.length), icon: Users },
    { label: "Integrations", value: `${connected} of ${integrations.length}`, icon: Blocks },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">
          {greetingOf(new Date())}, {app.signedInAs}
        </h1>
        <p className="page-subtitle">{crm ? `Your ${crm.label} data is in step. Here is what changed.` : `Connect your CRM to get the most out of ${app.productName}.`}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="panel">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="section-title">Recently synced</h2>
              <p className="text-xs text-slate-500">Changes from {crm?.label ?? "your CRM"} in the last 10 minutes</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-slate-500">
              {crm ? `Nothing changed in the last 10 minutes. Edits in ${crm.label} show up here as they happen.` : "Connect your CRM and changes show up here as they happen."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.slice(0, 8).map((record) => {
                const Icon = KIND_ICONS[record.kind];
                return (
                  <li key={`${record.kind}-${record.id}`} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{record.name}</p>
                      <p className="truncate text-xs text-slate-500">{record.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Updated {timeAgo(record.updatedAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel h-fit p-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Get started</h2>
            <span className="text-xs font-medium text-slate-500">
              {finished} of {checklist.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(finished / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-1">
            {checklist.map((item) => (
              <li key={item.title}>
                <Link to={item.to} className="group flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  {item.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 text-slate-300" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block font-medium ${item.done ? "text-slate-400 line-through" : "text-slate-900"}`}>{item.title}</span>
                    <span className="block text-xs text-slate-500">{item.detail}</span>
                  </span>
                  {!item.done && <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:text-brand" />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export { HomePage };
