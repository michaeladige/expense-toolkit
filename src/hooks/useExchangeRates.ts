import { useCallback, useEffect, useState } from "react";
import type { CachedRates, RateMap } from "../types";
import { STORAGE_KEYS } from "../lib/constants";
import { useLocalStorage } from "../store/useLocalStorage";

export type RateStatus = "idle" | "loading" | "live" | "cached" | "error";

/** Re-fetch if the cached rates for the current base are older than this. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Keyless, CORS-enabled rate providers, tried in order. Both return rates as
 * "units of currency X per 1 unit of `base`". We normalize to a RateMap and
 * always add the base itself as 1. The first that succeeds wins, so a single
 * provider outage doesn't take rates down.
 */
const PROVIDERS: {
  name: string;
  url: (base: string) => string;
  parse: (json: unknown) => RateMap | undefined;
}[] = [
  {
    name: "frankfurter",
    url: (base) =>
      `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`,
    parse: (json) => (json as { rates?: RateMap })?.rates,
  },
  {
    name: "open.er-api",
    url: (base) =>
      `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
    parse: (json) => {
      const j = json as { result?: string; rates?: RateMap };
      return j?.result === "success" ? j.rates : undefined;
    },
  },
];

/** Try each provider until one returns a usable rate map. */
async function fetchRateMap(base: string): Promise<RateMap> {
  let lastError: unknown;
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url(base));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = provider.parse(await res.json());
      if (parsed && Object.keys(parsed).length > 0) {
        return { ...parsed, [base]: 1 };
      }
      throw new Error("empty rates");
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("no rate provider available");
}

interface UseExchangeRates {
  /** Currency -> units per 1 base unit; base itself is 1. Empty until loaded. */
  rates: RateMap;
  status: RateStatus;
  fetchedAt: string | null;
  refresh: () => void;
}

/**
 * Fetch live FX rates for `base` from a keyless provider and cache them in
 * localStorage. After a first successful fetch the app converts offline using
 * the cache; network failures fall back to whatever is cached.
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
        const rates = await fetchRateMap(base);
        setCache({ base, rates, fetchedAt: new Date().toISOString() });
        setStatus("live");
      } catch (err) {
        // Offline or every provider failed: keep using cache if we have one.
        console.warn("[rates] fetch failed:", err);
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
