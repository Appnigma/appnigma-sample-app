import type { FunctionEntry, JsonObject, JsonValue } from "@appnigma/sdk";
import type { FunctionResult } from "@server-types/developer.types";
import { useEffect, useState, type FormEvent } from "react";
import { api, messageOf } from "../../api/client";
import { useApp } from "../../hooks/app-context";
import { Notice } from "../Notice";
import { Skeleton } from "../Skeleton";

const isJsonObject = (value: JsonValue): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);

const keyOf = (entry: FunctionEntry): string => `${entry.platform}/${entry.name}`;

// Your team's own functions, from catalog, and running one for a workspace
// with run: that workspace's own version answers when it has one.
const FunctionsTab = () => {
  const { app } = useApp();
  const [functions, setFunctions] = useState<FunctionEntry[] | null>(null);
  const [selected, setSelected] = useState("");
  const [workspace, setWorkspace] = useState(app.signedInAs ?? "");
  const [input, setInput] = useState("{}");
  const [result, setResult] = useState<FunctionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const list = (await api.functions()).functions.filter((entry) => entry.owner.type === "customer");
        setFunctions(list);
        setSelected(list[0] ? keyOf(list[0]) : "");
      } catch (failure) {
        setError(messageOf(failure));
      }
    })();
  }, []);

  const chosen = functions?.find((entry) => keyOf(entry) === selected);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!chosen) return;
    setError(null);
    setResult(null);
    try {
      const parsed: JsonValue = JSON.parse(input);
      if (!isJsonObject(parsed)) throw new Error("The input should be a JSON object.");
      setResult(await api.runFunction({ endCustomerId: workspace, platform: chosen.platform, functionName: chosen.name, input: parsed }));
    } catch (failure) {
      setError(messageOf(failure));
    }
  };

  if (!functions) return error ? <Notice tone="bad">{error}</Notice> : <Skeleton className="h-40" />;
  if (functions.length === 0) return <p className="text-slate-500">Your team has no functions of its own yet.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <ul className="panel divide-y divide-slate-100">
        {functions.map((entry) => (
          <li key={keyOf(entry)}>
            <button type="button" onClick={() => setSelected(keyOf(entry))} className={`w-full px-5 py-3 text-left hover:bg-slate-50 ${selected === keyOf(entry) ? "bg-brand/5" : ""}`}>
              <p className="font-medium">
                {entry.name} <span className="text-xs font-normal text-slate-400">{entry.platform}</span>
              </p>
              <p className="text-slate-500">{entry.description}</p>
              {entry.alwaysOn && <p className="text-xs text-slate-400">Runs on every matching call</p>}
            </button>
          </li>
        ))}
      </ul>
      {chosen && (
        <form onSubmit={(event) => void run(event)} className="panel space-y-3 p-5">
          <h2 className="section-title">Run {chosen.name}</h2>
          <label className="block">
            <span className="font-medium">For workspace</span>
            <select className="input mt-1" value={workspace} onChange={(event) => setWorkspace(event.target.value)}>
              {app.accounts.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-medium">Input</span>
            <textarea className="input mt-1 min-h-32 font-mono text-xs" value={input} onChange={(event) => setInput(event.target.value)} />
          </label>
          <button type="submit" className="button-primary">
            Run
          </button>
          {error && <Notice tone="bad">{error}</Notice>}
          {result && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">
                Answered by {result.ranAs.owner === "end_customer" ? "the workspace's own version" : "your version"} {result.ranAs.version}
              </p>
              <pre className="overflow-x-auto rounded-md bg-slate-950 p-3 font-mono text-xs text-emerald-300">{JSON.stringify(result.output, null, 2)}</pre>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export { FunctionsTab };
