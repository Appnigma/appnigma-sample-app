import type { AppInfo } from "@server-types/app.types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, messageOf } from "../api/client";
import { hexToRgbChannels } from "../lib/platforms";
import type { AppContextValue } from "../types/ui.types";

const AppContext = createContext<AppContextValue | null>(null);

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [app, setApp] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [underTheHoodOpen, setUnderTheHoodOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const info = await api.app();
      setApp(info);
      document.documentElement.style.setProperty("--brand", hexToRgbChannels(info.brandColor));
      document.title = info.productName;
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => (app ? { app, refresh, underTheHoodOpen, setUnderTheHoodOpen } : null), [app, refresh, underTheHoodOpen]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!value) return <div className="p-8 text-slate-500">Loading…</div>;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useApp = (): AppContextValue => {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp is only usable inside AppProvider");
  return value;
};

export { AppProvider, useApp };
