import { useCallback, useEffect, useState } from "react";
import { messageOf } from "../api/client";
import type { PollingState } from "../types/ui.types";

// Loads once, then again every intervalMs without flashing a loading state, so data that changes in the CRM shows up live.
const usePolling = <Value>(load: () => Promise<Value>, intervalMs: number): PollingState<Value> => {
  const [data, setData] = useState<Value | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, [load]);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), intervalMs);
    return () => clearInterval(timer);
  }, [reload, intervalMs]);

  return { data, error, reload };
};

export { usePolling };
