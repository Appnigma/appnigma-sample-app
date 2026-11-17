import {
  Bell,
  Blocks,
  ChevronsUpDown,
  Code2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Phone,
  Repeat,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { api } from "../api/client";
import { useApp } from "../hooks/app-context";
import { Avatar } from "./Avatar";
import { UnderTheHood } from "./UnderTheHood";

const NAV = [
  {
    to: "/",
    label: "Home",
    end: true,
    icon: LayoutDashboard,
    needsCalls: false,
  },
  {
    to: "/customers",
    label: "Customers",
    end: false,
    icon: Users,
    needsCalls: false,
  },
  {
    to: "/integrations",
    label: "Integrations",
    end: false,
    icon: Blocks,
    needsCalls: false,
  },
  { to: "/calls", label: "Calls", end: false, icon: Phone, needsCalls: true },
];

const WorkspaceMenu = () => {
  const { app, refresh } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await api.signOut();
    await refresh();
    navigate("/");
  };

  return (
    <div className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
          >
            <Repeat className="h-4 w-4 text-slate-400" /> Switch workspace
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4 text-slate-400" /> Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-100"
      >
        <Avatar name={app.signedInAs ?? "?"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900">
            {app.signedInAs}
          </span>
          <span className="block text-xs text-slate-500">
            Workspace · Pro plan
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
};

const Sidebar = () => {
  const { app } = useApp();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-sm">
          {app.productName.slice(0, 1)}
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          {app.productName}
        </span>
      </div>
      <nav className="mt-8 space-y-0.5">
        {NAV.filter((item) => !item.needsCalls || app.callsAvailable).map(
          (item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition ${isActive ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="flex items-center gap-1.5 font-semibold text-slate-800">
            <HelpCircle className="h-4 w-4 text-slate-400" /> Need a hand?
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Our team sets up integrations with you, free.
          </p>
        </div>
        <WorkspaceMenu />
      </div>
    </aside>
  );
};

const TopBar = () => {
  const { app, underTheHoodOpen, setUnderTheHoodOpen } = useApp();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/85 px-6 backdrop-blur">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white lg:hidden">
        {app.productName.slice(0, 1)}
      </span>
      <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400">
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">Search customers, deals, calls…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-500">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setUnderTheHoodOpen(!underTheHoodOpen)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 font-mono text-xs transition ${
            underTheHoodOpen
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" /> Under the hood
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
          <Bell className="h-4 w-4" />
        </span>
      </div>
    </header>
  );
};

const Layout = () => (
  <div className="min-h-screen">
    <div className="flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
    <UnderTheHood />
  </div>
);

export { Layout };
