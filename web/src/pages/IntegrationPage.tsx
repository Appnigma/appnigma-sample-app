import type { Integration } from "@server-types/integration.types";
import { ArrowDownUp, ArrowLeft, Blocks, Briefcase, Building2, CheckCircle2, ExternalLink, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api, messageOf } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PlatformLogo } from "../components/PlatformLogo";
import { PageSkeleton } from "../components/Skeleton";
import { StatusPill } from "../components/StatusPill";
import { infoOf } from "../lib/platforms";

const SYNCED_OBJECTS = [
  { label: "Companies", icon: Building2 },
  { label: "Contacts", icon: UserRound },
  { label: "Deals", icon: Briefcase },
];

// One integration: connect it, see that it is connected, and disconnect it.
const IntegrationPage = () => {
  const { platform = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const justConnected = searchParams.get("status") === "connected";
  const connectFailed = searchParams.get("status") === "failed";

  const load = useCallback(async () => {
    try {
      const { integrations } = await api.integrations();
      setIntegration(integrations.find((candidate) => candidate.platform === platform) ?? null);
      setLoaded(true);
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, [platform]);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    setWorking(true);
    try {
      window.location.href = (await api.connect(platform)).url;
    } catch (failure) {
      setError(messageOf(failure));
      setWorking(false);
    }
  };

  const disconnect = async () => {
    setWorking(true);
    try {
      await api.disconnect(platform);
      await load();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setWorking(false);
    }
  };

  if (error) return <EmptyState icon={<Blocks className="h-5 w-5" />} title="Something went wrong" detail={error} />;
  if (!loaded) return <PageSkeleton />;
  if (!integration) {
    return (
      <EmptyState
        icon={<Blocks className="h-5 w-5" />}
        title="This integration is not available yet"
        detail="Ask for it from the integrations page and you can follow it there."
        action={
          <Link to="/integrations" className="button-primary">
            Back to integrations
          </Link>
        }
      />
    );
  }

  const info = infoOf(integration.platform);
  const connected = integration.status === "connected";

  return (
    <div className="space-y-6">
      <Link to="/integrations" className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Integrations
      </Link>

      {justConnected && connected && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">{integration.label} is connected. Your data is coming in now.</p>
        </div>
      )}
      {connectFailed && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">The connection was not finished. You can try again whenever you like.</p>}

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-gradient-to-r from-slate-50 to-white p-6">
          <PlatformLogo platform={integration.platform} label={integration.label} size="large" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{integration.label}</h1>
              <StatusPill status={integration.status} />
            </div>
            <p className="mt-1 text-slate-500">{info.description}</p>
          </div>
          {connected ? (
            <button type="button" onClick={() => void disconnect()} disabled={working} className="button-secondary">
              Disconnect
            </button>
          ) : (
            <button type="button" onClick={() => void connect()} disabled={working} className="button-primary">
              Connect {integration.label} <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 p-4">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Sync</p>
              <p className="font-medium">{connected ? "Every few minutes, both ways" : "Starts when you connect"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <ArrowDownUp className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">What syncs</p>
              <p className="flex gap-2 font-medium">
                {integration.hasCrmData
                  ? SYNCED_OBJECTS.map((object) => (
                      <span key={object.label} className="inline-flex items-center gap-1">
                        <object.icon className="h-3.5 w-3.5 text-slate-400" /> {object.label}
                      </span>
                    ))
                  : "Set up for your team"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Access</p>
              <p className="font-medium">Only what this integration needs</p>
            </div>
          </div>
        </div>
      </section>

      {connected ? (
        <EmptyState
          icon={<PlatformLogo platform={integration.platform} label={integration.label} size="small" />}
          title={`${integration.label} is connected`}
          detail={
            integration.hasCrmData
              ? `Your companies, contacts and deals come in from ${integration.label}, and contacts you add here go out to it.`
              : `${integration.label} is ready for your team.`
          }
          action={
            integration.hasCrmData ? (
              <Link to="/customers" className="button-primary">
                See your customers
              </Link>
            ) : undefined
          }
        />
      ) : (
        <EmptyState
          icon={<PlatformLogo platform={integration.platform} label={integration.label} size="small" />}
          title={`Connect ${integration.label} to get started`}
          detail="You approve access on their side, then come straight back here. It takes about a minute."
        />
      )}
    </div>
  );
};

export { IntegrationPage };
