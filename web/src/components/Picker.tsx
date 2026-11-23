import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// A choice among more options than sit well side by side: the picked one on a
// button that opens the rest. It closes on a pick, a click elsewhere or Escape.
const Picker = <Value extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: Value; chip: string }[];
  value: Value;
  onChange: (value: Value) => void;
  label: string;
}) => {
  const [open, setOpen] = useState(false);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnClickElsewhere = (event: MouseEvent) => {
      if (event.target instanceof Node && !area.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnClickElsewhere);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnClickElsewhere);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const picked = options.find((option) => option.value === value);

  const pick = (choice: Value) => {
    onChange(choice);
    setOpen(false);
  };

  return (
    <div ref={area} className="relative">
      <button
        type="button"
        aria-label={`${label}: ${picked?.chip ?? "none chosen"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${picked ? "" : "text-slate-400"}`}>{picked?.chip ?? "Choose one"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={label} className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => pick(option.value)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 ${option.value === value ? "font-medium text-slate-900" : "text-slate-700"}`}
            >
              {option.chip}
              {option.value === value && <Check className="h-4 w-4 shrink-0 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { Picker };
