import type { JsonObject } from "@appnigma/sdk";
import type { ActionField, IntegrationAction, IntegrationDetail } from "@server-types";
import { Play, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import { SIDE_BY_SIDE_CHOICES } from "../constants/actions";
import { choicesOf, inputOf, typedInputOf } from "../lib/actions";
import { wordsOf } from "../lib/format";
import { ActionOutput } from "./ActionOutput";
import { Notice } from "./Notice";
import { Picker } from "./Picker";
import { Segmented } from "./Segmented";

const FieldName = ({ field }: { field: ActionField }) => (
  <span className="font-medium text-slate-800">
    {wordsOf(field.name)}
    {!field.required && <span className="ml-1 text-xs font-normal text-slate-400">optional</span>}
  </span>
);

const FieldHelp = ({ text }: { text: string | null }) => (text ? <span className="mt-1 block text-xs text-slate-500">{text}</span> : null);

// One field of an action's input, in the box its type takes. Yes/No and
// listed values are picked, never typed; anything deeper is typed as JSON.
const FieldBox = ({ field, value, onChange }: { field: ActionField; value: string; onChange: (value: string) => void }) => {
  if (field.type === "boolean" || field.type === "choice") {
    const choices = choicesOf(field);
    const label = wordsOf(field.name);
    return (
      <div>
        <FieldName field={field} />
        <div className="mt-1">
          {choices.length <= SIDE_BY_SIDE_CHOICES ? (
            <Segmented label={label} options={choices} value={value} onChange={onChange} />
          ) : (
            <Picker label={label} options={choices} value={value} onChange={onChange} />
          )}
        </div>
        <FieldHelp text={field.description} />
      </div>
    );
  }
  const numeric = field.type === "number" || field.type === "integer";
  return (
    <label className="block">
      <FieldName field={field} />
      {field.type === "json" ? (
        <textarea
          className="input mt-1 min-h-24 font-mono text-xs"
          required={field.required}
          placeholder="Written as JSON"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="input mt-1"
          type={numeric ? "number" : "text"}
          step={numeric ? (field.type === "integer" ? 1 : "any") : undefined}
          required={field.required}
          placeholder={field.type === "list" ? "Separate values with commas" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <FieldHelp text={field.description} />
    </label>
  );
};

// One action: a box for each field of its input, Run, and what came back.
// Every press of Run runs it once, on the account the workspace connected.
const ActionRunner = ({ integration, action }: { integration: IntegrationDetail; action: IntegrationAction }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [typedInput, setTypedInput] = useState("{}");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<JsonObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setOutput(null);
    try {
      const input = action.fields ? inputOf(action.fields, values) : typedInputOf(typedInput);
      setOutput((await api.runAction(integration.platform, action.name, input)).output);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setRunning(false);
    }
  };

  return (
    <form onSubmit={(event) => void run(event)} className="panel min-w-0 space-y-4 p-5">
      <div>
        <h2 className="section-title">{wordsOf(action.name)}</h2>
        {action.description && <p className="mt-0.5 text-slate-500">{action.description}</p>}
      </div>
      {action.fields?.length === 0 && <p className="text-slate-500">It needs nothing from you.</p>}
      {action.fields?.map((field) => (
        <FieldBox key={field.name} field={field} value={values[field.name] ?? ""} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} />
      ))}
      {action.fields === null && (
        <label className="block">
          <span className="font-medium text-slate-800">Input</span>
          <textarea className="input mt-1 min-h-32 font-mono text-xs" value={typedInput} onChange={(event) => setTypedInput(event.target.value)} />
          <FieldHelp text="Written as one JSON object." />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={running} className="button-primary">
          <Play className="h-4 w-4" /> {running ? "Running" : "Run"}
        </button>
        <span className="text-xs text-slate-500">Runs once on the {integration.label} account you connected.</span>
      </div>
      {error && <Notice tone="bad">{error}</Notice>}
      {output && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What came back</p>
          <ActionOutput output={output} />
        </div>
      )}
    </form>
  );
};

// The ready-made actions an integration has: pick one, fill in what it takes
// and run it on their own account.
const ActionsSection = ({ integration, actions }: { integration: IntegrationDetail; actions: IntegrationAction[] }) => {
  const [selected, setSelected] = useState(actions[0]?.name ?? "");
  const chosen = actions.find((action) => action.name === selected) ?? actions[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="panel h-fit overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {actions.map((action) => (
            <li key={action.name}>
              <button
                type="button"
                aria-pressed={chosen?.name === action.name}
                onClick={() => setSelected(action.name)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${chosen?.name === action.name ? "bg-brand/[0.06]" : "hover:bg-slate-50"}`}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Zap className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{wordsOf(action.name)}</span>
                  {action.description && <span className="mt-0.5 line-clamp-2 text-xs text-slate-500">{action.description}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {chosen && <ActionRunner key={`${integration.platform}/${chosen.name}`} integration={integration} action={chosen} />}
    </div>
  );
};

export { ActionsSection };
