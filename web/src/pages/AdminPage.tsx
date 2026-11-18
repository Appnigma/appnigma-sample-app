import { useState } from "react";
import { EventsTab } from "../components/admin/EventsTab";
import { FunctionsTab } from "../components/admin/FunctionsTab";
import { GuideTab } from "../components/admin/GuideTab";
import { NotificationsTab } from "../components/admin/NotificationsTab";
import { WorkspacesTab } from "../components/admin/WorkspacesTab";
import type { AdminTab } from "../types/ui.types";

const TABS: { tab: AdminTab; label: string }[] = [
  { tab: "workspaces", label: "Workspaces" },
  { tab: "notifications", label: "Webhooks and alerts" },
  { tab: "events", label: "Event log" },
  { tab: "functions", label: "Functions" },
  { tab: "guide", label: "Developer guide" },
];

// Your team's view across every workspace. In your product this sits behind
// your own staff login, not in front of your customers.
const AdminPage = () => {
  const [tab, setTab] = useState<AdminTab>("workspaces");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">For your team: every workspace's integrations, where you are told what happened, and your own functions.</p>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((option) => (
          <button
            key={option.tab}
            type="button"
            onClick={() => setTab(option.tab)}
            className={`-mb-px border-b-2 px-3 py-2.5 font-medium transition ${tab === option.tab ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {tab === "workspaces" && <WorkspacesTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "events" && <EventsTab />}
      {tab === "functions" && <FunctionsTab />}
      {tab === "guide" && <GuideTab />}
    </div>
  );
};

export { AdminPage };
