import type { ReactNode } from "react";

const TONES = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  waiting: "border-amber-200 bg-amber-50 text-amber-800",
  bad: "border-rose-200 bg-rose-50 text-rose-800",
  quiet: "border-slate-200 bg-slate-50 text-slate-600",
};

const Notice = ({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) => <div className={`rounded-xl border px-4 py-3 ${TONES[tone]}`}>{children}</div>;

export { Notice };
