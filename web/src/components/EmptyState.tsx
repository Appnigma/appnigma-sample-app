import type { ReactNode } from "react";

const EmptyState = ({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</span>
    <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
    <p className="mt-1 max-w-md text-slate-500">{detail}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export { EmptyState };
