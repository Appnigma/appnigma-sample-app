import type { IntegrationStatus } from "@server-types/integration.types";

const STATUS_STYLES: Record<IntegrationStatus, { label: string; className: string; dot: string }> = {
  connected: { label: "Connected", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  pending: { label: "Waiting for approval", className: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  needs_reconnect: { label: "Connect again", className: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
  disconnected: { label: "Not connected", className: "bg-slate-50 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
  not_connected: { label: "Not connected", className: "bg-slate-50 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
};

const StatusPill = ({ status }: { status: IntegrationStatus }) => {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

export { StatusPill };
