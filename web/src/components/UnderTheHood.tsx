import type { SdkCallRecord } from "@server-types";
import { Code2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { SDK_SNIPPETS } from "../constants/sdk-snippets";
import { useApp } from "../hooks/app-context";

const POLL_MS = 1500;

// Every SDK call this app's server made for you, newest first, with the line of code that made it.
const UnderTheHood = () => {
  const { underTheHoodOpen, setUnderTheHoodOpen } = useApp();
  const [calls, setCalls] = useState<SdkCallRecord[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!underTheHoodOpen) return;
    const load = async () => setCalls((await api.underTheHood()).calls);
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [underTheHoodOpen]);

  if (!underTheHoodOpen) return null;
  const chosen = calls.find((call) => call.id === selected) ?? calls[0];
  const snippet = chosen ? SDK_SNIPPETS[chosen.sdkMethod] : undefined;

  return (
    <aside className="fixed bottom-0 right-0 top-0 z-40 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
        <Code2 className="h-4 w-4 text-slate-400" />
        <p className="font-semibold">Under the hood</p>
        <span className="text-xs text-slate-400">SDK calls this page made</span>
        <button type="button" onClick={() => setUnderTheHoodOpen(false)} className="ml-auto text-slate-400 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      {chosen && snippet && (
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="font-mono text-xs text-slate-400">{snippet.file}</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-xs leading-5 text-emerald-300">{snippet.code}</pre>
        </div>
      )}
      <ul className="flex-1 overflow-y-auto">
        {calls.length === 0 && <li className="px-5 py-6 text-slate-400">No calls yet. Use the app and they show up here.</li>}
        {calls.map((call) => (
          <li key={call.id}>
            <button
              type="button"
              onClick={() => setSelected(call.id)}
              className={`flex w-full items-center gap-3 px-5 py-2.5 text-left font-mono text-xs hover:bg-slate-900 ${chosen?.id === call.id ? "bg-slate-900" : ""}`}
            >
              <span className={`w-9 font-semibold ${call.status && call.status < 400 ? "text-emerald-400" : "text-amber-400"}`}>{call.status ?? "ERR"}</span>
              <span className="flex-1 text-slate-100">appnigma.{call.sdkMethod}()</span>
              <span className="text-slate-500">{call.durationMs} ms</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export { UnderTheHood };
