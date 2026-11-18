import { X } from "lucide-react";
import type { ReactNode } from "react";

const SidePanel = ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => (
  <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20" onClick={onClose}>
    <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="section-title">{title}</h2>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </aside>
  </div>
);

export { SidePanel };
