import { useCallback, useEffect, useState } from "react";
import type { CachedRates, RateMap } from "../types";
import { STORAGE_KEYS } from "../lib/constants";
import { useLocalStorage } from "../store/useLocalStorage";

export type RateStatus = "idle" | "loading" | "live" | "cached" | "error";

const API = "https://api.frankfurter.app/latest";
/** Re-fetch if the cached rates for the current base are older than this. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

interface UseExchangeRates {
  /** Currency -> units per 1 base unit; base itself is 1. Empty until loaded. */
  rates: RateMap;
  status: RateStatus;
  fetchedAt: string | null;
  refresh: () => void;
}

/**
 * Fetch live FX rates for `base` from the keyless Frankfurter API and cache
 * them in localStorage. After a first successful fetch the app converts
 * offline using the cache; network failures fall back to whatever is cached.
 */
export function useExchangeRates(base: string): UseExchangeRates {
  const [cache, setCache] = useLocalStorage<CachedRates | null>(
    STORAGE_KEYS.rates,
    null
  );
  const [status, setStatus] = useState<RateStatus>("idle");

  const cacheValid = cache?.base === base ? cache : null;

  const fetchRates = useCallback(
    async (force: boolean) => {
      const fresh =
        cacheValid &&
        Date.now() - new Date(cacheValid.fetchedAt).getTime() < MAX_AGE_MS;
      if (fresh && !force) {
        setStatus("live");
        return;
      }

      setStatus("loading");
      try {
        const res = await fetch(`${API}?from=${encodeURIComponent(base)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { rates: RateMap };
        const rates: RateMap = { ...data.rates, [base]: 1 };
        setCache({ base, rates, fetchedAt: new Date().toISOString() });
        setStatus("live");
      } catch {
        // Offline or API error: keep using cache if we have it for this base.
        setStatus(cacheValid ? "cached" : "error");
      }
    },
    [base, cacheValid, setCache]
  );

  useEffect(() => {
    void fetchRates(false);
    // Only re-run when the base currency changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const rates: RateMap = cacheValid?.rates ?? { [base]: 1 };

  return {
    rates,
    status,
    fetchedAt: cacheValid?.fetchedAt ?? null,
    refresh: () => void fetchRates(true),
  };
}
