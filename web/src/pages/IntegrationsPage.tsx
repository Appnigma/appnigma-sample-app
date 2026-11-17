import type { Integration } from "@server-types/integration.types";
import { ArrowUpRight, Blocks } from "lucide-react";
import { Link } from "react-router";
import { api } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PlatformLogo } from "../components/PlatformLogo";
import { PageSkeleton } from "../components/Skeleton";
import { StatusPill } from "../components/StatusPill";
import { CATEGORY_ORDER, POPULAR_CATEGORY } from "../constants/platforms";
import { usePolling } from "../hooks/use-polling";
import { infoOf } from "../lib/platforms";

const REFRESH_MS = 5000;

const loadIntegrations = async (): Promise<Integration[]> => (await api.integrations()).integrations;

const IntegrationCard = ({ integration }: { integration: Integration }) => {
  const info = infoOf(integration.platform);
  return (
    <Link to={`/integrations/${integration.platform}`} className="panel group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between">
        <PlatformLogo platform={integration.platform} label={integration.label} />
        {info.category === POPULAR_CATEGORY && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Popular</span>}
      </div>
      <p className="mt-4 font-semibold text-slate-900">{integration.label}</p>
      <p className="mt-1 flex-1 text-slate-500">{info.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <StatusPill status={integration.status} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100">
          {integration.status === "connected" ? "Manage" : "Connect"} <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};

// Every platform switched on for your company. One Appnigma switches on for
// you shows up here by itself, with no change to this page.
const IntegrationsPage = () => {
  const { data: integrations, error } = usePolling(loadIntegrations, REFRESH_MS);

  if (error) return <EmptyState icon={<Blocks className="h-5 w-5" />} title="We could not load integrations" detail={error} />;
  if (!integrations) return <PageSkeleton />;

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    integrations: integrations.filter((integration) => infoOf(integration.platform).category === category),
  })).filter((group) => group.integrations.length > 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="page-title">Integrations</h1>
        <p className="page-subtitle">Connect the tools your team already uses. Your data stays in step automatically.</p>
      </div>

      {groups.length === 0 && (
        <EmptyState icon={<Blocks className="h-5 w-5" />} title="No integrations yet" detail="Integrations switched on for this product show up here." />
      )}

      {groups.map((group) => (
        <section key={group.category}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.integrations.map((integration) => (
              <IntegrationCard key={integration.platform} integration={integration} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export { IntegrationsPage };
