import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

// Code stays out of the way: the people using this page see plain words, and
// the code is one small click away for whoever wants it.
const ViewCode = ({ children, label = "View code" }: { children: ReactNode; label?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600">
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} {label}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
};

export { ViewCode };
