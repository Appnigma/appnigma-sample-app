import type { CustomLogicDetail, CustomLogicGoLive, CustomLogicItem, CustomLogicList, IntegrationDetail, LogicStage, NewCustomLogic } from "@server-types";
import type { LogicRun } from "@appnigma/sdk";
import { Check, ChevronDown, ChevronRight, CircleAlert, CircleCheck, Rocket, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import { LOGIC_POLL_MS, LOGIC_STAGES, LOGIC_STEPS, MOVING_STAGES, OBJECT_CHOICES, OPERATION_CHOICES, RUN_OUTCOMES, STEP_OF_STAGE, TIMING_CHOICES } from "../constants/custom-logic";
import { switchWordsOf, titleOf, whatItDoes } from "../lib/custom-logic";
import { timeAgo } from "../lib/format";
import type { PageMessage } from "../types/ui.types";
import { Notice } from "./Notice";
import { ViewCode } from "./ViewCode";

const PILL_TONES = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  waiting: "bg-amber-50 text-amber-800 ring-amber-600/20",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/20",
  quiet: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

const StagePill = ({ stage }: { stage: LogicStage }) => {
  const plain = LOGIC_STAGES[stage];
  return <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PILL_TONES[plain.tone]}`}>{plain.label}</span>;
};

// Writing it → Testing on sample data → Ready to go live → Live, with where it is now marked.
const Steps = ({ stage }: { stage: LogicStage }) => {
  const at = STEP_OF_STAGE[stage];
  const stopped = stage === "not_built" || stage === "needs_change" || stage === "failed";
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {LOGIC_STEPS.map((label, index) => {
        const done = index < at;
        const current = index === at;
        const dot = done ? "bg-emerald-500" : current ? (stopped ? "bg-rose-500" : "animate-pulse bg-brand") : "bg-slate-200";
        return (
          <li key={label} className={`flex items-center gap-1.5 text-xs font-medium ${done || current ? "text-slate-700" : "text-slate-400"}`}>
            {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <span className={`h-2 w-2 rounded-full ${dot}`} />}
            {label}
          </li>
        );
      })}
    </ol>
  );
};

const goLiveWords = (progress: CustomLogicGoLive): PageMessage => {
  if (progress.state === "checking") return { tone: "waiting", text: "Putting it live. This takes a minute or two." };
  if (progress.state === "live") return { tone: "good", text: `It's live${progress.version ? ` (version ${progress.version})` : ""}.` };
  if (progress.state === "failed") {
    const still = progress.stillLive ? " The version before is still running." : "";
    return { tone: "bad", text: `It didn't go live${progress.reason ? `: ${progress.reason}` : "."}${still}` };
  }
  return { tone: "quiet", text: "Nothing is going live right now." };
};

// What an always-on rule did on its last calls: outcomes and codes only, never the data it saw.
const RecentRuns = ({ platform, logicId }: { platform: string; logicId: string }) => {
  const [runs, setRuns] = useState<LogicRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRuns((await api.customLogicRuns(platform, logicId)).runs);
      } catch (failure) {
        setError(messageOf(failure));
      }
    })();
  }, [platform, logicId]);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent runs</p>
      {error && <p className="mt-1 text-slate-500">{error}</p>}
      {runs && runs.length === 0 && <p className="mt-1 text-slate-500">It hasn't run yet.</p>}
      {runs && runs.length > 0 && (
        <ul className="mt-1 divide-y divide-slate-100">
          {runs.map((run) => (
            <li key={`${run.requestId}-${run.attempt}`} className="flex items-center gap-3 py-2">
              <span className={`h-2 w-2 rounded-full ${run.outcome === "failed" ? "bg-rose-500" : "bg-emerald-500"}`} />
              <span className="flex-1">
                {RUN_OUTCOMES[run.outcome]}
                {run.errorCode && <span className="ml-2 text-xs text-slate-500">{run.errorCode}</span>}
              </span>
              <span className="text-xs text-slate-500">{timeAgo(run.ranAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// One rule opened in place: what it does, how its try went, and what can be
// done with it now. The code is one small click away, behind View code.
const RuleDetail = ({ platform, item, canChange, onChanged }: { platform: string; item: CustomLogicItem; canChange: boolean; onChanged: () => Promise<void> }) => {
  const [detail, setDetail] = useState<CustomLogicDetail | null>(null);
  const [message, setMessage] = useState<PageMessage | null>(null);
  const [working, setWorking] = useState(false);
  const [asking, setAsking] = useState(false);
  const [words, setWords] = useState("");
  const [code, setCode] = useState("");
  const [progress, setProgress] = useState<CustomLogicGoLive | null>(null);

  const load = useCallback(async () => {
    try {
      const opened = await api.customLogicDetail(platform, item.name);
      setDetail(opened);
      setCode(opened.draft?.code ?? opened.liveCode ?? "");
    } catch (failure) {
      setMessage({ tone: "bad", text: messageOf(failure) });
    }
  }, [platform, item.name]);

  // Read again whenever the rule moves on, so the actions match where it is.
  useEffect(() => {
    void load();
  }, [load, item.stage]);

  // While it goes live, ask how it is going until it settles.
  useEffect(() => {
    if (progress?.state !== "checking") return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const now = await api.customLogicGoLive(platform, item.name);
          setProgress(now);
          if (now.state !== "checking") await onChanged();
        } catch (failure) {
          setMessage({ tone: "bad", text: messageOf(failure) });
        }
      })();
    }, LOGIC_POLL_MS);
    return () => clearInterval(timer);
  }, [progress?.state, platform, item.name, onChanged]);

  const run = async (step: () => Promise<void>) => {
    setWorking(true);
    setMessage(null);
    try {
      await step();
    } catch (failure) {
      setMessage({ tone: "bad", text: messageOf(failure) });
    } finally {
      setWorking(false);
    }
  };

  const draft = detail?.draft ?? null;
  const moving = MOVING_STAGES.includes(item.stage);
  // A go-live that failed keeps its change, so Go live comes back for another try.
  const canGoLive = canChange && draft !== null && !moving && item.stage !== "not_built";

  const askForChange = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await api.changeCustomLogic(platform, item.name, words.trim());
      setWords("");
      setAsking(false);
      await onChanged();
    });
  };

  const putLive = () =>
    run(async () => {
      if (!draft) return;
      setProgress(await api.putCustomLogicLive(platform, item.name, draft.revision));
      await onChanged();
    });

  const throwAway = () =>
    run(async () => {
      if (!draft || !window.confirm("Throw away this change? What is live stays as it is.")) return;
      await api.discardCustomLogic(platform, item.name, draft.revision);
      await onChanged();
    });

  const flip = () =>
    run(async () => {
      if (!item.logicId) return;
      const switched = await api.switchCustomLogic(platform, item.logicId, !item.on);
      setMessage({ tone: "quiet", text: switched.on ? (switched.runs ? "Switched on." : "Switched on for you, but it is switched off for everyone right now.") : "Switched off." });
      await onChanged();
    });

  const saveCode = () =>
    run(async () => {
      if (!detail) return;
      await api.saveCustomLogicCode(platform, item.name, { code, revision: draft?.revision ?? 0, liveCodeSha: draft ? undefined : (detail.liveCodeSha ?? undefined) });
      setMessage({ tone: "good", text: "Saved as a change. Put it live when you're ready." });
      await onChanged();
    });

  const does = whatItDoes(item);

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What it does</p>
          <p className="mt-1 text-slate-700">{moving && item.stage === "writing" ? `Being written from: "${item.asked ?? does ?? ""}"` : (does ?? "No description yet.")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tried on sample data</p>
          {item.test ? (
            <p className={`mt-1 flex items-start gap-2 ${item.test.passed ? "text-emerald-700" : "text-rose-700"}`}>
              {item.test.passed ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
              {item.test.words}
            </p>
          ) : (
            <p className="mt-1 text-slate-500">{item.stage === "writing" || item.stage === "testing" ? "After it's written." : "Not tried yet."}</p>
          )}
        </div>
      </div>

      {item.reason && (item.stage === "not_built" || item.stage === "needs_change" || item.stage === "failed") && <Notice tone="bad">{item.reason}</Notice>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {progress && <Notice tone={goLiveWords(progress).tone}>{goLiveWords(progress).text}</Notice>}

      {canChange && (
        <div className="flex flex-wrap items-center gap-2">
          {canGoLive && (
            <button type="button" onClick={() => void putLive()} disabled={working} className="button-primary">
              <Rocket className="h-4 w-4" /> Go live
            </button>
          )}
          {!moving && (
            <button type="button" onClick={() => setAsking(!asking)} disabled={working} className="button-secondary">
              <Wand2 className="h-4 w-4" /> Ask for a change
            </button>
          )}
          {item.alwaysOn && item.logicId && (
            <button type="button" onClick={() => void flip()} disabled={working} className="button-secondary">
              {switchWordsOf(item)} · switch {item.on ? "off" : "on"}
            </button>
          )}
          {draft && !moving && (
            <button type="button" onClick={() => void throwAway()} disabled={working} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-700">
              <Trash2 className="h-3.5 w-3.5" /> Throw away this change
            </button>
          )}
        </div>
      )}

      {asking && (
        <form onSubmit={askForChange} className="space-y-2">
          <textarea className="input min-h-20" required placeholder="Also skip deals that are already closed." value={words} onChange={(event) => setWords(event.target.value)} />
          <button type="submit" disabled={working || !words.trim()} className="button-primary">
            Make the change
          </button>
        </form>
      )}

      {item.alwaysOn && item.logicId && <RecentRuns platform={platform} logicId={item.logicId} />}

      {detail && (detail.draft || detail.liveCode) && (
        <ViewCode>
          <div className="space-y-2">
            <p className="text-xs text-slate-500">{draft ? "The waiting change" : "What is live"}</p>
            <textarea className="input min-h-64 font-mono text-xs" readOnly={!canChange} value={code} onChange={(event) => setCode(event.target.value)} />
            {canChange && (
              <button type="button" onClick={() => void saveCode()} disabled={working} className="button-secondary">
                Save as a change
              </button>
            )}
          </div>
        </ViewCode>
      )}
    </div>
  );
};

// Asking for a new rule in plain words, with when it runs.
const NewRule = ({ integration, onStarted }: { integration: IntegrationDetail; onStarted: (name: string) => Promise<void> }) => {
  const [form, setForm] = useState<NewCustomLogic>({ request: "", timing: "before", object: "company", operation: "write" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { name } = await api.createCustomLogic(integration.platform, { ...form, request: form.request.trim() });
      setForm({ ...form, request: "" });
      await onStarted(name);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3 border-b border-slate-100 px-5 py-4">
      <label className="block">
        <span className="font-medium">What should happen?</span>
        <textarea
          className="input mt-1 min-h-20"
          required
          placeholder={`When a company is saved, put our Account tier into ${integration.label}'s customer tier.`}
          value={form.request}
          onChange={(event) => setForm({ ...form, request: event.target.value })}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500">Runs</span>
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
        <button type="submit" disabled={saving || !form.request.trim()} className="button-primary ml-auto">
          <Sparkles className="h-4 w-4" /> {saving ? "Starting" : "Create"}
        </button>
      </div>
      {error && <p className="text-rose-600">{error}</p>}
    </form>
  );
};

// Custom logic on one integration: this workspace's own rules, asked for in
// plain words, written and tried on sample data for them, then put live. The
// list reads itself again while a rule is being written, tested or put live.
const CustomLogicSection = ({ integration, canChange }: { integration: IntegrationDetail; canChange: boolean }) => {
  const [list, setList] = useState<CustomLogicList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await api.customLogic(integration.platform));
      setError(null);
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, [integration.platform]);

  useEffect(() => {
    void load();
  }, [load]);

  const moving = (list?.logic ?? []).some((item) => MOVING_STAGES.includes(item.stage));
  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(() => void load(), LOGIC_POLL_MS);
    return () => clearTimeout(timer);
  }, [moving, list, load]);

  const started = async (name: string) => {
    setOpened(name);
    await load();
  };

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="section-title">Custom logic</h2>
        <p className="mt-0.5 text-slate-500">Rules that run when your {integration.label} data is read or saved. Say what should happen, and it's written and tested for you.</p>
      </div>

      {canChange ? <NewRule integration={integration} onStarted={started} /> : <p className="border-b border-slate-100 px-5 py-4 text-slate-500">Custom logic is not switched on for your account yet.</p>}

      {error && <p className="px-5 py-4 text-rose-600">{error}</p>}
      {list?.heldBack.map((reason) => (
        <p key={reason} className="px-5 py-3 text-amber-700">
          Your newest change is held back, so the version before is still the one running: {reason}
        </p>
      ))}
      {!list && !error && <p className="px-5 py-6 text-slate-400">Reading…</p>}
      {list && list.logic.length === 0 && <p className="px-5 py-6 text-slate-500">No rules yet. Say what should happen above, and it shows up here while it's written.</p>}
      {list && list.logic.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {list.logic.map((item) => {
            const open = opened === item.name;
            const does = whatItDoes(item);
            return (
              <li key={item.name}>
                <button type="button" onClick={() => setOpened(open ? null : item.name)} aria-expanded={open} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50">
                  {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{titleOf(item.name)}</p>
                      <StagePill stage={item.stage} />
                    </div>
                    {does && <p className="truncate text-slate-500">{does}</p>}
                    {item.stage !== "live" && <Steps stage={item.stage} />}
                  </div>
                  {item.startedAt && <span className="shrink-0 text-xs text-slate-400">{timeAgo(item.startedAt)}</span>}
                </button>
                {open && <RuleDetail platform={integration.platform} item={item} canChange={canChange} onChanged={load} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export { CustomLogicSection };
