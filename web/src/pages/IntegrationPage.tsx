import type { AccountDetail, IntegrationAction, IntegrationDetail } from "@server-types";
import type { ConnectField, PlatformCoverage } from "@appnigma/sdk";
import { ArrowDownUp, ArrowLeft, Blocks, Briefcase, Building2, CheckCircle2, ExternalLink, History, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { api, codeOf, messageOf } from "../api/client";
import { CustomLogicSection } from "../components/CustomLogicSection";
import { EmptyState } from "../components/EmptyState";
import { Notice } from "../components/Notice";
import { PlatformLogo } from "../components/PlatformLogo";
import { PageSkeleton } from "../components/Skeleton";
import { StatusPill } from "../components/StatusPill";
import { useApp } from "../hooks/app-context";
import { usePolling } from "../hooks/use-polling";
import { timeAgo } from "../lib/format";
import { infoOf } from "../lib/platforms";
import { syncStatusOf } from "../lib/sync";

const CHANGES_REFRESH_MS = 30_000;

const OBJECT_ICONS = { contact: UserRound, company: Building2, deal: Briefcase };

const OBJECT_LABELS = { contact: "Contacts", company: "Companies", deal: "Deals" };

const TONE_TEXT = { good: "text-emerald-700", waiting: "text-amber-700", bad: "text-rose-700", quiet: "text-slate-600" };

const coverageWords = (coverage: PlatformCoverage): string => {
  const reads = coverage.actions.includes("list") || coverage.actions.includes("get");
  const writes = coverage.actions.includes("create") || coverage.actions.includes("update");
  if (reads && writes) return "read and write";
  return writes ? "write" : "read";
};

// For a platform that logs in with details someone types, such as a forum
// address and an API key: one box per field platforms.get lists. What they
// type goes to this app's server, which sends it on encrypted.
const ConnectForm = ({ integration, onConnected }: { integration: IntegrationDetail; onConnected: () => Promise<void> }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.connectWithDetails(integration.platform, values);
      setValues({});
      await onConnected();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setSaving(false);
    }
  };

  const fieldBox = (field: ConnectField) => (
    <label key={field.name} className="block">
      <span className="font-medium text-slate-800">
        {field.label}
        {!field.required && <span className="ml-1 text-xs font-normal text-slate-400">optional</span>}
      </span>
      <span className="mt-1 flex items-center gap-2">
        {field.prefix && <span className="text-slate-400">{field.prefix}</span>}
        <input
          className="input"
          type={field.inputType}
          required={field.required}
          autoComplete="off"
          value={values[field.name] ?? ""}
          onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
        />
      </span>
      {field.helpText && <span className="mt-1 block text-xs text-slate-500">{field.helpText}</span>}
    </label>
  );

  return (
    <form onSubmit={(event) => void submit(event)} className="panel space-y-4 p-5">
      <div>
        <h2 className="section-title">Connect with your {integration.label} details</h2>
        <p className="mt-0.5 text-xs text-slate-500">They are checked with {integration.label} before anything is saved, which can take a few seconds.</p>
      </div>
      {integration.fields.map(fieldBox)}
      {error && <p className="text-rose-600">{error}</p>}
      <button type="submit" disabled={saving} className="button-primary">
        {saving ? "Checking with " + integration.label : `Connect ${integration.label}`}
      </button>
    </form>
  );
};

// What changed in their account, from this app's own copy of their records,
// which a background job and records.changed webhooks keep fresh.
const RecentChangesPanel = ({ integration }: { integration: IntegrationDetail }) => {
  const load = useCallback(() => api.changes(integration.platform), [integration.platform]);
  const { data, error } = usePolling(load, CHANGES_REFRESH_MS);

  return (
    <section className="panel">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <History className="h-4 w-4 text-slate-400" />
        <h2 className="section-title">Recent changes in {integration.label}</h2>
      </div>
      {error && <p className="px-5 py-6 text-slate-500">{error}</p>}
      {!error && !data && <p className="px-5 py-6 text-slate-400">Reading…</p>}
      {data && !data.syncOn && <p className="px-5 py-6 text-slate-500">Keeping a copy of these records is switched off.</p>}
      {data?.syncOn && !data.available && <p className="px-5 py-6 text-slate-500">{integration.label} cannot list its changes by time, so they are not copied here.</p>}
      {data?.available && data.changes.length === 0 && <p className="px-5 py-6 text-slate-500">Nothing has changed in the last week.</p>}
      {data?.available && data.changes.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.changes.map((change) => {
            const Icon = OBJECT_ICONS[change.object];
            return (
              <li key={`${change.object}-${change.recordId}-${change.updatedAt}`} className="flex items-center gap-3 px-5 py-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="min-w-0 flex-1 truncate font-medium">{change.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{timeAgo(change.updatedAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {data?.available && data.lastReadAt && <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">Kept up to date in the background · last read {timeAgo(data.lastReadAt)}</p>}
    </section>
  );
};

// Which account they connected, read from the platform's own API.
const ConnectedAccount = ({ integration }: { integration: IntegrationDetail }) => {
  const [details, setDetails] = useState<AccountDetail[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setDetails((await api.account(integration.platform)).account);
      } catch (failure) {
        // The account card is extra: when it cannot be read, it is left out.
        console.warn(messageOf(failure));
        setDetails([]);
      }
    })();
  }, [integration.platform]);

  if (!details || details.length === 0) return null;
  return (
    <section className="panel p-5">
      <h2 className="section-title">Connected account</h2>
      <dl className="mt-3 space-y-2">
        {details.map((detail) => (
          <div key={detail.label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{detail.label}</dt>
            <dd className="truncate font-medium">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

// The ready-made actions it has. Like the account card, it is left out when
// it cannot be read.
const ActionsPanel = ({ integration }: { integration: IntegrationDetail }) => {
  const [actions, setActions] = useState<IntegrationAction[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        setActions((await api.actions(integration.platform)).actions);
      } catch (failure) {
        console.warn(messageOf(failure));
        setActions([]);
      }
    })();
  }, [integration.platform]);

  if (actions.length === 0) return null;
  return (
    <section className="panel p-5">
      <h2 className="section-title flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-slate-400" /> What {integration.label} can do here
      </h2>
      <ul className="mt-3 space-y-2">
        {actions.map((action) => (
          <li key={action.name}>
            <p className="font-medium">{action.description || action.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

// One integration: connect it, through their approval page or from your own
// form, see how it is doing, and disconnect it.
const IntegrationPage = () => {
  const { platform = "" } = useParams();
  const { app } = useApp();
  const [searchParams] = useSearchParams();
  const [integration, setIntegration] = useState<IntegrationDetail | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const justConnected = searchParams.get("status") === "connected";
  const connectFailed = searchParams.get("status") === "failed";

  const load = useCallback(async () => {
    try {
      setIntegration((await api.integration(platform)).integration);
    } catch (failure) {
      // A platform not switched on for you, or not one at all.
      if (codeOf(failure) === "PLATFORM_NOT_ENABLED" || codeOf(failure) === "INVALID_INPUT") setUnavailable(true);
      else setError(messageOf(failure));
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

  if (unavailable) {
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
  if (error && !integration) return <EmptyState icon={<Blocks className="h-5 w-5" />} title="Something went wrong" detail={error} />;
  if (!integration) return <PageSkeleton />;

  const info = infoOf(integration.platform);
  const connected = integration.status === "connected";
  const typesDetails = integration.connectionType === "fields";
  const sync = syncStatusOf(integration.sync);

  return (
    <div className="space-y-6">
      <Link to="/integrations" className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Integrations
      </Link>

      {justConnected && connected && (
        <Notice tone="good">
          <span className="flex items-center gap-3 font-medium">
            <CheckCircle2 className="h-5 w-5" /> {integration.label} is connected. Your data is coming in now.
          </span>
        </Notice>
      )}
      {connectFailed && <Notice tone="waiting">The connection was not finished. You can try again whenever you like.</Notice>}
      {integration.status === "needs_reconnect" && <Notice tone="bad">This connection stopped working. Connect {integration.label} again to pick up where it left off.</Notice>}
      {error && <Notice tone="bad">{error}</Notice>}

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 bg-gradient-to-r from-slate-50 to-white p-6">
          <PlatformLogo platform={integration.platform} label={integration.label} logoUrl={integration.logoUrl} size="large" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{integration.label}</h1>
              <StatusPill status={integration.status} />
            </div>
            <p className="mt-1 text-slate-500">{info.description}</p>
          </div>
          {connected && (
            <button type="button" onClick={() => void disconnect()} disabled={working} className="button-secondary">
              Disconnect
            </button>
          )}
          {!connected && (
            <button type="button" onClick={() => void connect()} disabled={working} className={typesDetails ? "button-secondary" : "button-primary"}>
              {typesDetails ? "Use the connect page instead" : `Connect ${integration.label}`} <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 p-4">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Changes</p>
              <p className={`font-medium ${connected ? TONE_TEXT[sync.tone] : ""}`}>{connected ? sync.label : "Starts when you connect"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <ArrowDownUp className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">What syncs</p>
              <p className="flex flex-wrap gap-x-3 font-medium">
                {integration.coverage.length > 0
                  ? integration.coverage.map((coverage) => (
                      <span key={coverage.object}>
                        {OBJECT_LABELS[coverage.object]} <span className="font-normal text-slate-500">({coverageWords(coverage)})</span>
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

      {!connected && typesDetails && <ConnectForm integration={integration} onConnected={load} />}

      {connected ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {app.features.sync && integration.crmData !== "none" ? (
              <RecentChangesPanel integration={integration} />
            ) : (
              <EmptyState
                icon={<PlatformLogo platform={integration.platform} label={integration.label} logoUrl={integration.logoUrl} size="small" />}
                title={`${integration.label} is connected`}
                detail={integration.crmData !== "none" ? `Your companies, contacts and deals come in from ${integration.label}, and what you add here goes out to it.` : `${integration.label} is ready for your team.`}
                action={
                  integration.crmData !== "none" ? (
                    <Link to="/customers" className="button-primary">
                      See your customers
                    </Link>
                  ) : undefined
                }
              />
            )}
          </div>
          <div className="space-y-6">
            <ConnectedAccount integration={integration} />
            <ActionsPanel integration={integration} />
          </div>
        </div>
      ) : (
        !typesDetails && (
          <EmptyState
            icon={<PlatformLogo platform={integration.platform} label={integration.label} logoUrl={integration.logoUrl} size="small" />}
            title={`Connect ${integration.label} to get started`}
            detail="You approve access on their side, then come straight back here. It takes about a minute."
          />
        )
      )}

      {connected && integration.crmData !== "none" && <CustomLogicSection integration={integration} canChange={app.features.portal} />}
    </div>
  );
};

export { IntegrationPage };
