import type { CustomerOverview } from "@server-types/customer.types";
import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import { markDone } from "../lib/progress";
import type { AddKind } from "../types/ui.types";

const KINDS: { kind: AddKind; label: string; hint: string }[] = [
  { kind: "contact", label: "Contact", hint: "The same email never makes a duplicate." },
  { kind: "company", label: "Company", hint: "The same domain never makes a duplicate." },
  { kind: "deal", label: "Deal", hint: "Adding the same deal name again updates that deal." },
];

const EMPTY_FORM: Record<string, string> = {};

// Adds a contact, a company or a deal straight to their CRM.
const AddRecordCard = ({ overview, onClose, onAdded }: { overview: CustomerOverview; onClose: () => void; onAdded: () => Promise<void> }) => {
  const [kind, setKind] = useState<AddKind>("contact");
  const [form, setForm] = useState<Record<string, string>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const platform = overview.platform;
  const value = (key: string): string => form[key]?.trim() ?? "";

  const send = async (crm: string) => {
    if (kind === "contact") return api.addContact({ platform: crm, firstName: value("firstName"), lastName: value("lastName"), email: value("email") });
    if (kind === "company") return api.addCompany({ platform: crm, name: value("name"), domain: value("domain") });
    return api.addDeal({
      platform: crm,
      name: value("name"),
      amount: value("amount") ? Number(value("amount")) : undefined,
      closeDate: value("closeDate") || undefined,
      companyId: value("companyId") || undefined,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!platform) return;
    setSaving(true);
    setError(null);
    try {
      await send(platform);
      if (kind === "contact") markDone("contact");
      setForm(EMPTY_FORM);
      await onAdded();
      onClose();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setSaving(false);
    }
  };

  const box = (key: string, placeholder: string, type = "text", required = true) => (
    <input className="input" required={required} type={type} placeholder={placeholder} value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
  );

  return (
    <form onSubmit={(event) => void submit(event)} className="panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex gap-1">
            {KINDS.map((option) => (
              <button
                key={option.kind}
                type="button"
                onClick={() => setKind(option.kind)}
                className={`rounded-lg px-3 py-1.5 font-medium ${kind === option.kind ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Saved straight to {overview.platformLabel}. {KINDS.find((option) => option.kind === kind)?.hint}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {kind === "contact" && (
          <>
            {box("firstName", "First name")}
            {box("lastName", "Last name")}
            {box("email", "Email", "email")}
          </>
        )}
        {kind === "company" && (
          <>
            {box("name", "Company name")}
            {box("domain", "Domain, such as northwind.com")}
          </>
        )}
        {kind === "deal" && (
          <>
            {box("name", "Deal name")}
            {box("amount", "Amount", "number", false)}
            {box("closeDate", "Close date", "date", false)}
            <select className="input" value={form.companyId ?? ""} onChange={(event) => setForm({ ...form, companyId: event.target.value })}>
              <option value="">No company</option>
              {overview.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-rose-600">{error}</p>}
      <button type="submit" disabled={saving} className="button-primary mt-3">
        <Plus className="h-4 w-4" /> {saving ? "Saving" : `Add to ${overview.platformLabel}`}
      </button>
    </form>
  );
};

export { AddRecordCard };
