import { ArrowRight, BarChart3, Blocks, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api, messageOf } from "../api/client";
import { Avatar } from "../components/Avatar";
import { useApp } from "../hooks/app-context";

const HIGHLIGHTS = [
  { icon: BarChart3, text: "Every customer, deal and call in one place" },
  { icon: Blocks, text: "Connect the tools your team already uses" },
  { icon: ShieldCheck, text: "Your data stays yours, and in step" },
];

// A stand-in for your own login: each workspace is one of your customers.
const SignInPage = () => {
  const { app, refresh } = useApp();
  const [error, setError] = useState<string | null>(null);

  const signIn = async (account: string) => {
    try {
      await api.signIn(account);
      await refresh();
    } catch (failure) {
      setError(messageOf(failure));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-base font-bold text-brand">{app.productName.slice(0, 1)}</span>
            <span className="text-lg font-semibold">{app.productName}</span>
          </div>
          <div className="relative">
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">The workspace your client team runs on.</h1>
            <ul className="mt-8 space-y-3">
              {HIGHLIGHTS.map((highlight) => (
                <li key={highlight.text} className="flex items-center gap-3 text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                    <highlight.icon className="h-4 w-4" />
                  </span>
                  {highlight.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm text-white/60">Trusted by teams that live in their CRM.</p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2.5 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">{app.productName.slice(0, 1)}</span>
              <span className="text-lg font-semibold">{app.productName}</span>
            </div>
            <h2 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">Sign in to your workspace</h2>
            <p className="mt-2 text-slate-500">Choose the company you work for.</p>
            <ul className="mt-8 space-y-2.5">
              {app.accounts.map((account) => (
                <li key={account}>
                  <button
                    type="button"
                    onClick={() => void signIn(account)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:border-brand/50 hover:shadow-md"
                  >
                    <Avatar name={account} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{account}</span>
                      <span className="block text-xs text-slate-500">Workspace</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
                  </button>
                </li>
              ))}
            </ul>
            {error && <p className="mt-4 text-red-600">{error}</p>}
            <p className="mt-10 text-xs text-slate-400">This sign-in is a stand-in for your own login.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export { SignInPage };
