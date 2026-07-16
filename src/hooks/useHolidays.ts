import { useCallback, useEffect, useMemo, useState } from "react";
import type { CachedHolidays, Holiday, YearCalendar } from "../types";
import { STORAGE_KEYS } from "../lib/constants";
import { fromISODate } from "../lib/dates";
import { useLocalStorage } from "../store/useLocalStorage";
import type { WorkCalendar } from "../lib/workdays";

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
  /** Which countries this provider answers for. */
  supports: (country: string) => boolean;
  url: (year: number, country: string) => string;
  parse: (json: unknown, year: number) => YearCalendar | undefined;
}

/** True for Sat/Sun in local time. */
function isWeekendISO(iso: string): boolean {
  const dow = fromISODate(iso).getDay();
  return dow === 0 || dow === 6;
}

/**
 * Keyless, CORS-enabled providers, tried in order for the countries each
 * supports — same spirit as `useExchangeRates`'s PROVIDERS, but routed by
 * country rather than raced, because no two of these cover the same place.
 *
 * Holiday data is near-immutable, so a failed fetch just retries on the next
 * app open rather than serving something stale.
 */
const PROVIDERS: Provider[] = [
  {
    name: "nager.date",
    // Everything except the countries with a dedicated provider below.
    supports: (country) => country !== TAIWAN,
    url: (year, country) =>
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${encodeURIComponent(country)}`,
    parse: (json) => {
      if (!Array.isArray(json)) return undefined;
      const holidays = json
        // Nager also returns Observance/Optional entries (e.g. Lincoln's
        // Birthday) which are *not* days off. Only "Public" closes offices.
        .filter((h) => Array.isArray(h?.types) && h.types.includes("Public"))
        .map((h) => ({
          date: String(h.date),
          localName: String(h.localName ?? h.name ?? ""),
          global: h.global === true,
          counties: Array.isArray(h.counties) ? h.counties.map(String) : undefined,
        }));
      // Nager publishes no make-up working days for any country it covers.
      return { holidays, workdays: [] };
    },
  },
  {
    // Nager has no Taiwan, and Taiwan's own data.gov.tw sends
    // `Access-Control-Allow-Origin: https://data.gov.tw`, so a browser-only app
    // can't read it. This is a community mirror of the same government calendar
    // (行政院人事行政總處), served over jsDelivr with CORS open. If it ever goes
    // away, TW simply falls back to weekends-only like any failed fetch.
    name: "ruyut/TaiwanCalendar",
    supports: (country) => country === TAIWAN,
    url: (year) =>
      `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`,
    parse: (json) => {
      if (!Array.isArray(json)) return undefined;
      const holidays: Holiday[] = [];
      const workdays: string[] = [];
      for (const d of json) {
        // A day-by-day calendar ("20260101"), not a holiday list.
        const raw = String(d?.date ?? "");
        if (!/^\d{8}$/.test(raw)) continue;
        const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
        const weekend = isWeekendISO(iso);
        if (d.isHoliday === true) {
          // Weekend days are flagged as holidays here, but the Mon-Fri rule
          // already covers those — only weekday closures need recording.
          if (!weekend) {
            holidays.push({
              date: iso,
              localName: String(d.description || "假日"),
              global: true,
            });
          }
        } else if (weekend) {
          // 補行上班: a Saturday the country works to bridge a long weekend.
          workdays.push(iso);
        }
      }
      return { holidays, workdays };
    },
  },
];

/** Ask the provider that covers `country` for one year's calendar. */
async function fetchYear(year: number, country: string): Promise<YearCalendar> {
  let lastError: unknown;
  for (const provider of PROVIDERS) {
    if (!provider.supports(country)) continue;
    try {
      const res = await fetch(provider.url(year, country));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Nager answers 204 (empty body) for a country it doesn't know, which
      // `res.ok` accepts — json() would then throw a parse error instead of
      // something legible.
      if (res.status === 204) throw new Error(`${provider.name}: no data for ${country}`);
      const parsed = provider.parse(await res.json(), year);
      // An empty holiday list is a legitimate answer, so unlike rates only
      // `undefined` counts as a failure.
      if (parsed) return parsed;
      throw new Error(`${provider.name}: unparseable response`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error(`no holiday provider covers ${country}`);
}

export interface CountryOption {
  code: string;
  name: string;
}

/** ISO 3166-1 alpha-2 for Taiwan, which needs its own provider. */
const TAIWAN = "TW";

/** Guards against a cache entry written by a build with a different shape. */
function isYearCalendar(v: unknown): v is YearCalendar {
  return (
    !!v &&
    Array.isArray((v as YearCalendar).holidays) &&
    Array.isArray((v as YearCalendar).workdays)
  );
}

/**
 * Countries offered in the picker: whatever Nager covers, plus the ones served
 * by a dedicated provider above. Cached alongside the calendars.
 */
async function fetchCountries(): Promise<CountryOption[]> {
  const res = await fetch("https://date.nager.at/api/v3/AvailableCountries");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error("unparseable country list");
  const list = json
    .map((c) => ({ code: String(c.countryCode), name: String(c.name) }))
    .filter((c) => c.code);
  if (!list.some((c) => c.code === TAIWAN)) {
    list.push({ code: TAIWAN, name: "Taiwan" });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export interface UseHolidays {
  /** Holidays + make-up workdays that apply to the selected country/region. */
  calendar: WorkCalendar;
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
      // Shape-check as well as presence: an entry written by an older build has
      // a different shape, and reading it would silently yield no holidays.
      // Treating it as uncovered just refetches over it.
      const covered =
        cacheValid && years.every((y) => isYearCalendar(cacheValid.years[String(y)]));
      if (covered && !force) {
        setStatus("cached");
        return;
      }

      setStatus("loading");
      try {
        const fetched = await Promise.all(years.map((y) => fetchYear(y, country)));
        const next: Record<string, YearCalendar> = {};
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
    // Refresh in the background every mount rather than only when empty: the
    // cached list is what an *earlier build* fetched, so a guard on
    // `length > 0` would strand existing users on a stale list forever (e.g.
    // one fetched before Taiwan was appended). The cached value still renders
    // immediately; this only replaces it, and only when it actually differs.
    fetchCountries()
      .then((fresh) =>
        setCountries((prev) =>
          JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh
        )
      )
      .catch((err) => console.warn("[holidays] country list failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const holidays = useMemo(() => {
    const days = new Set<string>();
    const workdays = new Set<string>();
    const knownYears = new Set<number>();
    const regions = new Set<string>();

    for (const [year, entry] of Object.entries(cacheValid?.years ?? {})) {
      if (!isYearCalendar(entry)) continue;
      knownYears.add(Number(year));
      for (const w of entry.workdays) workdays.add(w);
      for (const h of entry.holidays) {
        for (const c of h.counties ?? []) regions.add(c);
        // No region selected means nationwide holidays only: a regional day off
        // elsewhere in the country shouldn't move this user's transaction.
        const applies = h.global || (region ? (h.counties?.includes(region) ?? false) : false);
        if (applies) days.add(h.date);
      }
    }
    return {
      calendar: { holidays: days, workdays },
      knownYears,
      regions: [...regions].sort(),
    };
    // Memoizing matters more here than in useExchangeRates, which rebuilds its
    // rate map every render. That's harmless there (it only feeds useMemos);
    // here the calendar flows into useRecurring's effect deps, and a new object
    // each render would re-subscribe its listeners and re-run a state-writing
    // check every render. `cache` is useState-backed, so this memo is stable.
  }, [cacheValid, region]);

  return {
    calendar: holidays.calendar,
    knownYears: holidays.knownYears,
    regions: holidays.regions,
    countries,
    status,
    fetchedAt: cacheValid?.fetchedAt ?? null,
    refresh: () => void fetchHolidays(true),
  };
}
