// A small set of choices shown side by side, the picked one raised: for a few options that are all worth seeing.
const Segmented = <Value extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: Value; chip: string }[];
  value: Value;
  onChange: (value: Value) => void;
  label: string;
}) => (
  <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        onClick={() => onChange(option.value)}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${option.value === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
      >
        {option.chip}
      </button>
    ))}
  </div>
);

export { Segmented };
