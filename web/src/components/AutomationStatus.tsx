import type { LogicStatus } from "@appnigma/sdk";
import { AUTOMATION_STATUS } from "../constants/automations";

const TONES = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  waiting: "bg-amber-50 text-amber-800 ring-amber-600/20",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/20",
  quiet: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

const AutomationStatus = ({ status }: { status: LogicStatus }) => {
  const plain = AUTOMATION_STATUS[status];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[plain.tone]}`}>{plain.label}</span>;
};

export { AutomationStatus };
