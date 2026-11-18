import type { CustomerRecord } from "@server-types/customer.types";
import type { RecordEdit } from "@server-types/customer.types";
import { useEffect, useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import { money, timeAgo } from "../lib/format";
import type { OpenRecord } from "../types/ui.types";
import { SidePanel } from "./SidePanel";
import { Skeleton } from "./Skeleton";

const TITLES = { contacts: "Contact", companies: "Company", deals: "Deal" };

const formOf = (opened: CustomerRecord): Record<string, string> => {
  if (opened.kind === "contacts") {
    const contact = opened.record;
    return { firstName: contact.firstName ?? "", lastName: contact.lastName ?? "", email: contact.emails[0]?.value ?? "", phone: contact.phones[0]?.value ?? "" };
  }
  if (opened.kind === "companies") return { name: opened.record.name ?? "", domain: opened.record.domain ?? "" };
  return { name: opened.record.name ?? "", amount: opened.record.amount === null ? "" : String(opened.record.amount), closeDate: opened.record.closeDate ?? "" };
};

const editOf = (kind: OpenRecord["kind"], platform: string, form: Record<string, string>): RecordEdit => {
  const value = (key: string): string => form[key]?.trim() ?? "";
  if (kind === "contacts") return { kind, platform, firstName: value("firstName"), lastName: value("lastName"), email: value("email"), phone: value("phone") || undefined };
  if (kind === "companies") return { kind, platform, name: value("name"), domain: value("domain") || undefined };
  return { kind, platform, name: value("name"), amount: value("amount") ? Number(value("amount")) : null, closeDate: value("closeDate") || null };
};

const FIELDS: Record<OpenRecord["kind"], { key: string; label: string; type: string }[]> = {
  contacts: [
    { key: "firstName", label: "First name", type: "text" },
    { key: "lastName", label: "Last name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
  ],
  companies: [
    { key: "name", label: "Name", type: "text" },
    { key: "domain", label: "Domain", type: "text" },
  ],
  deals: [
    { key: "name", label: "Name", type: "text" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "closeDate", label: "Close date", type: "date" },
  ],
};

const summaryOf = (opened: CustomerRecord): string => {
  if (opened.kind === "deals") return `${money(opened.record.amount, opened.record.currency)} · ${opened.record.stage?.label ?? "No stage"}`;
  if (opened.kind === "companies") return opened.record.domain ?? "";
  return opened.record.emails[0]?.value ?? "";
};

// One record, read fresh from their CRM when it opens, and changed in place.
const RecordPanel = ({ open, platform, platformLabel, onClose, onSaved }: { open: OpenRecord; platform: string; platformLabel: string; onClose: () => void; onSaved: () => Promise<void> }) => {
  const [opened, setOpened] = useState<CustomerRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const record = await api.customerRecord(open.kind, open.id, platform);
        setOpened(record);
        setForm(formOf(record));
      } catch (failure) {
        setMessage(messageOf(failure));
      }
    })();
  }, [open.kind, open.id, platform]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await api.updateCustomerRecord(open.kind, open.id, editOf(open.kind, platform, form));
      setOpened(saved);
      setForm(formOf(saved));
      setMessage(`Saved to ${platformLabel}.`);
      await onSaved();
    } catch (failure) {
      setMessage(messageOf(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel title={TITLES[open.kind]} onClose={onClose}>
      {!opened && !message && <Skeleton className="h-40" />}
      {opened && (
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <div>
            <p className="text-lg font-semibold">{opened.kind === "contacts" ? opened.record.fullName : opened.record.name}</p>
            <p className="text-slate-500">{summaryOf(opened)}</p>
            {opened.record.updatedAt && <p className="mt-1 text-xs text-slate-400">Last changed in {platformLabel} {timeAgo(opened.record.updatedAt)}</p>}
          </div>
          {FIELDS[open.kind].map((field) => (
            <label key={field.key} className="block">
              <span className="font-medium text-slate-800">{field.label}</span>
              <input className="input mt-1" type={field.type} value={form[field.key] ?? ""} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
            </label>
          ))}
          <button type="submit" disabled={saving} className="button-primary">
            {saving ? "Saving" : `Save to ${platformLabel}`}
          </button>
        </form>
      )}
      {message && <p className="mt-3 text-slate-600">{message}</p>}
    </SidePanel>
  );
};

export { RecordPanel };
