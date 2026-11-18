import type { AutomationDetail, AutomationGoLive, AutomationTrial } from "@server-types";
import type { JsonObject, JsonValue, LogicEntry, LogicRun } from "@appnigma/sdk";
import { ArrowLeft, CheckCircle2, FlaskConical, Rocket, Trash2, Workflow } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { api, messageOf } from "../api/client";
import { AutomationStatus } from "../components/AutomationStatus";
import { EmptyState } from "../components/EmptyState";
import { Notice } from "../components/Notice";
import { PageSkeleton } from "../components/Skeleton";
import { ViewCode } from "../components/ViewCode";
import { GO_LIVE_POLL_MS, RUN_OUTCOMES, SAMPLE_TRIAL_INPUT } from "../constants/automations";
import { useApp } from "../hooks/app-context";
import { problemsInWords, switchWordsOf, titleOf } from "../lib/automations";
import { timeAgo } from "../lib/format";
import type { PageMessage } from "../types/ui.types";

const isJsonObject = (value: JsonValue): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);

const goLiveWords = (progress: AutomationGoLive): PageMessage => {
  if (progress.state === "checking") return { tone: "waiting", text: "Putting it live. This takes a minute or two." };
  if (progress.state === "live") return { tone: "good", text: `It is live${progress.version ? ` (version ${progress.version})` : ""}.` };
  if (progress.state === "failed") {
    const still = progress.stillLive ? " The version before is still running." : "";
    return { tone: "bad", text: `It did not go live${progress.reason ? `: ${progress.reason}` : ""}.${still}` };
  }
  return { tone: "quiet", text: progress.version ? `Version ${progress.version} is live.` : "Nothing is going live right now." };
};

const TrialResult = ({ trial }: { trial: AutomationTrial }) => (
  <div className="space-y-2">
    <Notice tone={trial.outcome === "answered" ? "good" : "bad"}>{trial.summary}</Notice>
    <ViewCode>
      <div className="space-y-2 text-xs">
        {trial.calls.length > 0 && (
          <div>
            <p className="font-medium text-slate-600">What it would call</p>
            <ul className="font-mono text-slate-500">
              {trial.calls.map((call, index) => (
                <li key={`${call}-${index}`}>{call}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="font-medium text-slate-600">What it answered</p>
        <pre className="overflow-x-auto rounded-md bg-slate-950 p-3 font-mono text-emerald-300">{JSON.stringify(trial.output, null, 2)}</pre>
        {trial.problems.map((problem, index) => (
          <p key={`${problem.message}-${index}`} className="font-mono text-rose-600">
            {problem.line !== null ? `Line ${problem.line}: ` : ""}
            {problem.message}
          </p>
        ))}
      </div>
    </ViewCode>
  </div>
);

// What an always-on automation did on each call, newest first: outcomes and
// codes only, never the data it saw.
const RunsPanel = ({ entry }: { entry: LogicEntry }) => {
  const [runs, setRuns] = useState<LogicRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entry.logicId) return;
    const logicId = entry.logicId;
    void (async () => {
      try {
        setRuns((await api.automationRuns(logicId)).runs);
      } catch (failure) {
        setError(messageOf(failure));
      }
    })();
  }, [entry.logicId]);

  return (
    <section className="panel">
      <h2 className="section-title border-b border-slate-100 px-5 py-4">Recent runs</h2>
      {error && <p className="px-5 py-6 text-slate-500">{error}</p>}
      {runs && runs.length === 0 && <p className="px-5 py-6 text-slate-500">It has not run yet.</p>}
      {runs && runs.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {runs.map((run) => (
            <li key={`${run.requestId}-${run.attempt}`} className="flex items-center gap-3 px-5 py-3">
              <span className={`h-2 w-2 rounded-full ${run.outcome === "failed" ? "bg-rose-500" : "bg-emerald-500"}`} />
              <span className="flex-1 font-medium">
                {RUN_OUTCOMES[run.outcome]}
                {run.errorCode && <span className="ml-2 text-xs font-normal text-slate-500">{run.errorCode}</span>}
              </span>
              <span className="text-xs text-slate-500">
                {run.timing} the call · {timeAgo(run.ranAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// One automation: what it does, ask for a change in plain words, check it,
// try it on a sample, put it live, and switch it on or off. The code is there
// for whoever wants it, behind View code.
const AutomationPage = () => {
  const { platform = "", name = "" } = useParams();
  const { app } = useApp();
  const canChange = app.features.portal;
  const [detail, setDetail] = useState<AutomationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<PageMessage | null>(null);
  const [working, setWorking] = useState(false);
  const [words, setWords] = useState("");
  const [trialInput, setTrialInput] = useState(SAMPLE_TRIAL_INPUT);
  const [trial, setTrial] = useState<AutomationTrial | null>(null);
  const [code, setCode] = useState("");
  const [progress, setProgress] = useState<AutomationGoLive | null>(null);

  const load = useCallback(async () => {
    try {
      const opened = await api.automation(platform, name);
      setDetail(opened);
      setCode(opened.draft?.code ?? opened.liveCode ?? "");
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, [platform, name]);

  useEffect(() => {
    void load();
  }, [load]);

  // While it is going live, ask how it is going until it settles.
  useEffect(() => {
    if (progress?.state !== "checking") return;
    const timer = setInterval(() => {
      void (async () => {
        try {
          const now = await api.goLiveProgress(platform, name);
          setProgress(now);
          if (now.state !== "checking") await load();
        } catch (failure) {
          setMessage({ tone: "bad", text: messageOf(failure) });
        }
      })();
    }, GO_LIVE_POLL_MS);
    return () => clearInterval(timer);
  }, [progress?.state, platform, name, load]);

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

  const askForChange = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const changed = await api.changeAutomation(platform, name, words, detail?.draft?.revision);
      setMessage(changed.saved ? { tone: "good", text: changed.summary ?? "Changed. Try it, then put it live." } : { tone: "bad", text: `That change did not pass the checks, so nothing was saved. ${problemsInWords(changed.problems)} Try saying it another way.` });
      if (changed.saved) setWords("");
      await load();
    });
  };

  const check = () =>
    run(async () => {
      const checked = await api.checkAutomation(platform, name);
      setMessage(checked.ready ? { tone: "good", text: "It passes the checks and is ready to go live." } : { tone: "bad", text: `${problemsInWords(checked.problems)} Ask for a change to fix it.` });
    });

  const tryIt = () =>
    run(async () => {
      const parsed: JsonValue = JSON.parse(trialInput);
      if (!isJsonObject(parsed)) throw new Error("The sample should be a JSON object.");
      setTrial(await api.tryAutomation(platform, name, parsed));
    });

  const putLive = () =>
    run(async () => {
      if (!detail?.draft) return;
      setProgress(await api.putAutomationLive(platform, name, detail.draft.revision));
    });

  const throwAway = () =>
    run(async () => {
      if (!detail?.draft || !window.confirm("Throw away this change? What is live stays as it is.")) return;
      await api.throwAwayDraft(platform, name, detail.draft.revision);
      setMessage({ tone: "quiet", text: "The change was thrown away." });
      await load();
    });

  const flip = (entry: LogicEntry) =>
    run(async () => {
      if (!entry.logicId) return;
      const switched = await api.switchAutomation(entry.logicId, !entry.on);
      setMessage({ tone: "quiet", text: switched.on ? (switched.runs ? "Switched on." : "Switched on for you, but it is switched off for everyone right now.") : "Switched off." });
      await load();
    });

  const saveCode = () =>
    run(async () => {
      if (!detail) return;
      await api.saveAutomationCode(platform, name, { code, revision: detail.draft?.revision ?? 0, liveCodeSha: detail.draft ? undefined : (detail.liveCodeSha ?? undefined) });
      setMessage({ tone: "good", text: "Saved as a change. Check it, then put it live." });
      await load();
    });

  if (error) return <EmptyState icon={<Workflow className="h-5 w-5" />} title="We could not open this automation" detail={error} />;
  if (!detail) return <PageSkeleton />;

  const entry = detail.entry;
  const draft = detail.draft;

  return (
    <div className="space-y-6">
      <Link to="/automations" className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Automations
      </Link>

      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{titleOf(detail.name)}</h1>
              {entry && <AutomationStatus status={entry.status} />}
            </div>
            <p className="mt-1 text-slate-500">{entry?.description ?? "Not live yet, so there is no description."}</p>
            {entry?.failure && <p className="mt-2 text-rose-700">The last change did not go live: {entry.failure.reason}</p>}
          </div>
          {entry?.alwaysOn && entry.logicId && (
            <button type="button" onClick={() => void flip(entry)} disabled={working} className="button-secondary">
              {switchWordsOf(entry)} · switch {entry.on ? "off" : "on"}
            </button>
          )}
        </div>
        {draft && (
          <p className="mt-4 text-sm text-amber-700">
            A change is waiting, saved {timeAgo(draft.updatedAt)}. {draft.goingLive ? "It is going live." : "Try it, then put it live."}
          </p>
        )}
      </section>

      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {progress && <Notice tone={goLiveWords(progress).tone}>{goLiveWords(progress).text}</Notice>}

      <div className="grid gap-6 lg:grid-cols-2">
        {canChange && (
          <form onSubmit={askForChange} className="panel space-y-3 p-5">
            <h2 className="section-title">Ask for a change</h2>
            <textarea className="input min-h-24" required placeholder="Also skip deals that are already closed." value={words} onChange={(event) => setWords(event.target.value)} />
            <button type="submit" disabled={working} className="button-primary">
              {working ? "Working" : "Make the change"}
            </button>
          </form>
        )}

        <section className="panel space-y-3 p-5">
          <h2 className="section-title">Check and try it</h2>
          <p className="text-slate-500">Trying it runs it once on a sample, somewhere safe: nothing in your CRM is read or changed.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void check()} disabled={working} className="button-secondary">
              <CheckCircle2 className="h-4 w-4" /> Check it
            </button>
            <button type="button" onClick={() => void tryIt()} disabled={working} className="button-secondary">
              <FlaskConical className="h-4 w-4" /> Try it
            </button>
          </div>
          <ViewCode>
            <p className="mb-1 text-xs text-slate-500">The sample it is handed</p>
            <textarea className="input min-h-32 font-mono text-xs" value={trialInput} onChange={(event) => setTrialInput(event.target.value)} />
          </ViewCode>
          {trial && <TrialResult trial={trial} />}
        </section>
      </div>

      {canChange && draft && (
        <section className="panel flex flex-wrap items-center gap-3 p-5">
          <p className="flex-1 text-slate-600">When it does what you want, put it live. It then runs on every matching call.</p>
          <button type="button" onClick={() => void throwAway()} disabled={working} className="button-secondary">
            <Trash2 className="h-4 w-4" /> Throw away this change
          </button>
          <button type="button" onClick={() => void putLive()} disabled={working || draft.goingLive} className="button-primary">
            <Rocket className="h-4 w-4" /> Put it live
          </button>
        </section>
      )}

      {entry?.alwaysOn && entry.logicId && <RunsPanel entry={entry} />}

      <ViewCode>
        <div className="panel space-y-3 p-5">
          <p className="text-xs text-slate-500">{draft ? "The waiting change" : "What is live"}</p>
          <textarea className="input min-h-72 font-mono text-xs" readOnly={!canChange} value={code} onChange={(event) => setCode(event.target.value)} />
          {canChange && (
            <button type="button" onClick={() => void saveCode()} disabled={working} className="button-secondary">
              Save as a change
            </button>
          )}
        </div>
      </ViewCode>
    </div>
  );
};

export { AutomationPage };
