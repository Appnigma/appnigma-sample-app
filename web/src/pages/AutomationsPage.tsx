import type { NewAutomation } from "@server-types/automation.types";
import type { Integration } from "@server-types/integration.types";
import { ExternalLink, Plus, Workflow } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { api, messageOf } from "../api/client";
import { AutomationStatus } from "../components/AutomationStatus";
import { EmptyState } from "../components/EmptyState";
import { Notice } from "../components/Notice";
import { PlatformLogo } from "../components/PlatformLogo";
import { PageSkeleton } from "../components/Skeleton";
import { OBJECT_CHOICES, OPERATION_CHOICES, TIMING_CHOICES } from "../constants/automations";
import { useApp } from "../hooks/app-context";
import { usePolling } from "../hooks/use-polling";
import { problemsInWords, switchWordsOf, titleOf } from "../lib/automations";
import { connectedCrmsOf } from "../lib/platforms";

const REFRESH_MS = 10_000;

// A new automation, asked for in plain words: when it runs, and what it should do.
const NewAutomationCard = ({ crms, onClose }: { crms: Integration[]; onClose: () => void }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<NewAutomation>({ platform: crms[0]?.platform ?? "", name: "", timing: "before", object: "deal", operation: "write", request: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const made = await api.createAutomation({ ...form, name: form.name.trim() });
      if (!made.saved) {
        setMessage(`It was started, but the first version did not pass the checks. ${problemsInWords(made.problems)} Open it and ask again in other words.`);
        return;
      }
      navigate(`/automations/${form.platform}/${form.name.trim()}`);
    } catch (failure) {
      setMessage(messageOf(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="panel space-y-4 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="section-title">New automation</h2>
          <p className="mt-0.5 text-xs text-slate-500">Say what it should do. It is written for you and stays off until you put it live.</p>
        </div>
        <button type="button" onClick={onClose} className="text-xs font-medium text-slate-400 hover:text-slate-700">
          Cancel
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-medium">Name</span>
          <input className="input mt-1" required placeholder="round-deal-amounts" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="block">
          <span className="font-medium">Integration</span>
          <select className="input mt-1" value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>
            {crms.map((crm) => (
              <option key={crm.platform} value={crm.platform}>
                {crm.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">Runs</span>
        <select className="input w-auto" value={form.timing} onChange={(event) => setForm({ ...form, timing: TIMING_CHOICES.find((choice) => choice.value === event.target.value)?.value ?? form.timing })}>
          {TIMING_CHOICES.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label.toLowerCase()}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={form.object} onChange={(event) => setForm({ ...form, object: OBJECT_CHOICES.find((choice) => choice.value === event.target.value)?.value ?? form.object })}>
          {OBJECT_CHOICES.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={form.operation} onChange={(event) => setForm({ ...form, operation: OPERATION_CHOICES.find((choice) => choice.value === event.target.value)?.value ?? form.operation })}>
          {OPERATION_CHOICES.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
      <label className="block">
        <span className="font-medium">What should it do?</span>
        <textarea
          className="input mt-1 min-h-24"
          required
          placeholder="Round every deal amount to the nearest 100 before it is saved."
          value={form.request}
          onChange={(event) => setForm({ ...form, request: event.target.value })}
        />
      </label>
      {message && <p className="text-slate-600">{message}</p>}
      <button type="submit" disabled={saving || !form.platform} className="button-primary">
        {saving ? "Writing it, this can take a minute" : "Create automation"}
      </button>
    </form>
  );
};

// The workspace's own automations: what each does, whether it is live, and
// whether it is on. Changing them needs the automation feature switched on.
const AutomationsPage = () => {
  const { app } = useApp();
  const load = useCallback(async () => {
    const [list, { integrations }] = await Promise.all([api.automations(), api.integrations()]);
    return { ...list, crms: connectedCrmsOf(integrations), integrations };
  }, []);
  const { data, error } = usePolling(load, REFRESH_MS);
  const [creating, setCreating] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const openEditor = async () => {
    setEditorError(null);
    try {
      window.open((await api.automationEditorLink()).url, "_blank", "noopener");
    } catch (failure) {
      setEditorError(messageOf(failure));
    }
  };

  if (error) return <EmptyState icon={<Workflow className="h-5 w-5" />} title="We could not load your automations" detail={error} />;
  if (!data) return <PageSkeleton />;

  const labelOf = (platform: string) => data.integrations.find((integration) => integration.platform === platform);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Automations</h1>
          <p className="page-subtitle">Small rules that run around your integrations, such as rounding deal amounts or tidying new contacts.</p>
        </div>
        {app.features.portal && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void openEditor()} className="button-secondary">
              Open the editor <ExternalLink className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setCreating(!creating)} disabled={data.crms.length === 0} className="button-primary">
              <Plus className="h-4 w-4" /> New automation
            </button>
          </div>
        )}
      </div>

      {!app.features.portal && <Notice tone="quiet">Changing automations is not switched on for your workspace yet. You can still see and try the ones you have.</Notice>}
      {editorError && <Notice tone="bad">{editorError}</Notice>}
      {data.heldBack.map((reason) => (
        <Notice key={reason} tone="waiting">
          Your newest changes are held back, so the version before is still the one running: {reason}
        </Notice>
      ))}
      {creating && <NewAutomationCard crms={data.crms} onClose={() => setCreating(false)} />}

      {data.automations.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-5 w-5" />}
          title="No automations yet"
          detail={data.crms.length === 0 ? "Connect your CRM first, then add a rule that runs whenever its data is read or saved." : "Add a rule that runs whenever your CRM data is read or saved."}
          action={
            data.crms.length === 0 ? (
              <Link to="/integrations" className="button-primary">
                Connect your CRM
              </Link>
            ) : undefined
          }
        />
      ) : (
        <section className="panel divide-y divide-slate-100">
          {data.automations.map((automation) => {
            const integration = labelOf(automation.platform);
            return (
              <Link key={`${automation.platform}-${automation.name}`} to={`/automations/${automation.platform}/${automation.name}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                <PlatformLogo platform={automation.platform} label={integration?.label ?? automation.platform} logoUrl={integration?.logoUrl ?? null} size="small" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{titleOf(automation.name)}</p>
                  <p className="truncate text-slate-500">{automation.description ?? "No description yet"}</p>
                </div>
                {automation.hasDraft && <span className="text-xs font-medium text-amber-700">A change is waiting</span>}
                <span className="text-xs text-slate-500">{switchWordsOf(automation)}</span>
                <AutomationStatus status={automation.status} />
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
};

export { AutomationsPage };
