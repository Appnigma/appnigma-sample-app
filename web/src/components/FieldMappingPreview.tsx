import { ArrowLeftRight, Sparkles } from "lucide-react";
import { MAPPING_PREVIEW } from "../constants/integration";

// What field mapping will look like here: clearly a preview, nothing on it can be clicked or changed.
const FieldMappingPreview = ({ label }: { label: string }) => (
  <section className="panel overflow-hidden">
    <div className="flex items-start gap-3 border-b border-slate-100 bg-brand/5 px-5 py-4">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <div>
        <p className="font-semibold">Coming soon: field mapping</p>
        <p className="mt-0.5 text-slate-500">
          Choose which of your fields fill which of {label}'s, including the custom fields you add there, or just say it in plain words. This is a preview of how it
          will look.
        </p>
      </div>
    </div>
    <div aria-disabled="true" className="pointer-events-none grid select-none gap-4 p-5 opacity-80 lg:grid-cols-3">
      {MAPPING_PREVIEW.map((group) => (
        <div key={group.object} className="overflow-hidden rounded-xl border border-slate-200">
          <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.object}</p>
          <ul className="divide-y divide-slate-100">
            {group.pairs.map((pair) => (
              <li key={pair.yours} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5">
                <span className="truncate rounded-md border border-slate-200 bg-white px-2 py-1">{pair.yours}</span>
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate rounded-md bg-slate-100 px-2 py-1 text-slate-600">{pair.theirs}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export { FieldMappingPreview };
