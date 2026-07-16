import { useCallback, useEffect, useMemo, useState } from "react";
import type { CachedHolidays, Holiday } from "../types";
import { STORAGE_KEYS } from "../lib/constants";
import { useLocalStorage } from "../store/useLocalStorage";
import type { HolidaySet } from "../lib/workdays";

/**
 * Like `RateStatus`, plus `off`. A base currency always exists, but a holiday
 * country is optional — without a terminal "not configured" state the recurring
 * gate would wait forever on a fetch that never starts, and rules would never
 * fire. `off` means "go ahead with weekends only", not "wait".
 */
export type HolidayStatus = "off" | "idle" | "loading" | "live" | "cached" | "error";

/**
 * Years fetched around the current one. Covers the ordinary backfill window: a
 * rule resuming in January still needs December's holidays, and "next due" can
 * point into next year. A rule dormant for years can outrun this — see
 * `knownYears`, which is how callers find out.
 */
function requiredYears(now: Date): number[] {
  const y = now.getFullYear();
  return [y - 1, y, y + 1];
}

interface Provider {
  name: string;
  url: (year: number, country: string) => string;
  parse: (json: unknown) => Holiday[] | undefined;
}

/**
 * Keyless, CORS-enabled holiday providers, tried in order — same shape as
 * `useExchangeRates`'s PROVIDERS so a second can be dropped in without
 * restructuring. Only one today: unlike FX there's no comparable keyless
 * provider with worldwide coverage, and holiday data is near-immutable, so a
 * failed fetch just retries on the next app open instead of serving a stale
 * number.
 */
const PROVIDERS: Provider[] = [
  {
    name: "nager.date",
    url: (year, country) =>
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${encodeURIComponent(country)}`,
    parse: (json) => {
      if (!Array.isArray(json)) return undefined;
      return (
        json
          // Nager also returns Observance/Optional entries (e.g. Lincoln's
          // Birthday) which are *not* days off. Only "Public" closes offices.
          .filter((h) => Array.isArray(h?.types) && h.types.includes("Public"))
          .map((h) => ({
            date: String(h.date),
            localName: String(h.localName ?? h.name ?? ""),
            global: h.global === true,
            counties: Array.isArray(h.counties) ? h.counties.map(String) : undefined,
          }))
      );
    },
  },
];

/** Try each provider until one returns a usable list for this year. */
async function fetchYear(year: number, country: string): Promise<Holiday[]> {
  let lastError: unknown;
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url(year, country));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = provider.parse(await res.json());
      // An empty array is a legitimate answer (a country with no public
      // holidays that year), so unlike rates, only `undefined` is a failure.
      if (parsed) return parsed;
      throw new Error(`${provider.name}: unparseable response`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("no holiday provider available");
}

export interface CountryOption {
  code: string;
  name: string;
}

/** Countries the provider has data for. Cached alongside the holidays. */
async function fetchCountries(): Promise<CountryOption[]> {
  const res = await fetch("https://date.nager.at/api/v3/AvailableCountries");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error("unparseable country list");
  return json
    .map((c) => ({ code: String(c.countryCode), name: String(c.name) }))
    .filter((c) => c.code);
}

export interface UseHolidays {
  /** Local "YYYY-MM-DD" of every holiday that applies to the selected region. */
  days: HolidaySet;
  /** Years the cache actually covers, so callers can tell "no holidays" from
   *  "not loaded" — an empty Set can't. */
  knownYears: ReadonlySet<number>;
  /** Subdivisions that have at least one holiday of their own this cache. */
  regions: string[];
  /** Countries the provider covers. Empty until the first successful fetch. */
  countries: CountryOption[];
  status: HolidayStatus;
  fetchedAt: string | null;
  refresh: () => void;
}

/**
 * Fetch public holidays for `country` and cache them in localStorage, so the
 * working-day anchors of recurring rules resolve correctly offline after a
 * first successful fetch.
 *
 * Unlike `useExchangeRates` there's no age-based expiry: published holidays
 * don't drift the way FX rates do, so the cache stays valid as long as it
 * covers the country and the years being asked about. Governments do amend
 * calendars occasionally, hence `refresh`.
 */
export function useHolidays(country?: string, region?: string): UseHolidays {
  const [cache, setCache] = useLocalStorage<CachedHolidays | null>(
    STORAGE_KEYS.holidays,
    null
  );
  const [countries, setCountries] = useLocalStorage<CountryOption[]>(
    STORAGE_KEYS.holidayCountries,
    []
  );
  const [status, setStatus] = useState<HolidayStatus>(country ? "idle" : "off");

  // A cache for another country is treated as absent rather than stale, so
  // switching country can never resolve a rule against the wrong calendar.
  const cacheValid = country && cache?.country === country ? cache : null;

  const fetchHolidays = useCallback(
    async (force: boolean) => {
      if (!country) {
        setStatus("off");
        return;
      }

      const years = requiredYears(new Date());
      const covered =
        cacheValid && years.every((y) => cacheValid.years[String(y)] !== undefined);
      if (covered && !force) {
        setStatus("cached");
        return;
      }

      setStatus("loading");
      try {
        const fetched = await Promise.all(years.map((y) => fetchYear(y, country)));
        const next: Record<string, Holiday[]> = {};
        years.forEach((y, i) => (next[String(y)] = fetched[i]));
        setCache({ country, years: next, fetchedAt: new Date().toISOString() });
        setStatus("live");
      } catch (err) {
        // Offline or the provider failed: keep using the cache if we have one.
        // Either way this is a terminal state — working-day rules fall back to
        // weekends rather than waiting forever.
        console.warn("[holidays] fetch failed:", err);
        setStatus(cacheValid ? "cached" : "error");
      }
    },
    [country, cacheValid, setCache]
  );

  useEffect(() => {
    void fetchHolidays(false);
    // Only re-run when the country changes: `fetchHolidays` changes identity
    // with `cacheValid`, so the honest dep array would refetch-loop. Same
    // constraint as useExchangeRates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    if (countries.length > 0) return;
    fetchCountries()
      .then(setCountries)
      .catch((err) => console.warn("[holidays] country list failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const holidays = useMemo(() => {
    const days = new Set<string>();
    const knownYears = new Set<number>();
    const regions = new Set<string>();

    for (const [year, list] of Object.entries(cacheValid?.years ?? {})) {
      knownYears.add(Number(year));
      for (const h of list) {
        for (const c of h.counties ?? []) regions.add(c);
        // No region selected means nationwide holidays only: a regional day off
        // elsewhere in the country shouldn't move this user's transaction.
        const applies = h.global || (region ? (h.counties?.includes(region) ?? false) : false);
        if (applies) days.add(h.date);
      }
    }
    return { days, knownYears, regions: [...regions].sort() };
    // Memoizing matters more here than in useExchangeRates, which rebuilds its
    // rate map every render. That's harmless there (it only feeds useMemos);
    // here `days` flows into useRecurring's effect deps, and a new Set each
    // render would re-subscribe its listeners and re-run a state-writing check
    // on every render. `cache` is useState-backed, so this memo is stable.
  }, [cacheValid, region]);

  return {
    days: holidays.days,
    knownYears: holidays.knownYears,
    regions: holidays.regions,
    countries,
    status,
    fetchedAt: cacheValid?.fetchedAt ?? null,
    refresh: () => void fetchHolidays(true),
  };
}
