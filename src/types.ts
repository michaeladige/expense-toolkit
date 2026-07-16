import type { ThemeColor, ThemeMode, ThemePattern } from "./lib/theme";
import type { Language } from "./lib/i18n/types";

export type PeriodType = "day" | "week" | "month";

/** Periods that get an automatic report. A subset of PeriodType, so the
 *  date helpers (getRange, shiftPeriod, ...) accept these directly. */
export type ReportPeriod = Extract<PeriodType, "week" | "month">;

export type EntryKind = "expense" | "income";

/**
 * The fields an expense and an income have in common — enough to convert to a
 * base currency and group by category or date. The helpers in `lib/summary.ts`
 * take `Entry` so they serve both sides without duplication.
 */
export interface Entry {
  /** Amount in the entry's own currency. */
  amount: number;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  categoryId: string;
  /** "YYYY-MM-DD" (local date the entry occurred). */
  date: string;
}

export interface Expense extends Entry {
  id: string;
  note?: string;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** Set when this entry was materialized from a RecurringRule. */
  recurringId?: string;
}

/** Money coming in. Same shape as Expense, but categorised from its own list. */
export interface Income extends Entry {
  id: string;
  note?: string;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** Set when this entry was materialized from a RecurringRule. */
  recurringId?: string;
}

/**
 * An expense or income tagged with the side it came from. Expenses and income
 * are stored separately but shown in one list, so the tag is what tells the UI
 * which category list to resolve against and which sign to render.
 */
export type TaggedEntry =
  | ({ kind: "expense" } & Expense)
  | ({ kind: "income" } & Income);

export interface Category {
  id: string;
  name: string;
  /** Hex color used in charts and accents. */
  color: string;
  /** Optional emoji glyph. */
  icon?: string;
}

export interface Budget {
  id: string;
  /** A category id, or "all" for an overall monthly limit. */
  categoryId: string | "all";
  /** Monthly limit expressed in the base currency. */
  amount: number;
}

/** How often a recurring rule fires. A subset of PeriodType, so the date
 *  helpers (getRange, shiftPeriod, ...) accept these directly. */
export type RecurringFrequency = Extract<PeriodType, "week" | "month">;

/**
 * Where in its period a recurring rule lands. The working-day anchors are
 * resolved against weekends plus the public holidays of `Settings.holidayCountry`.
 */
export type RecurringAnchor =
  | "day-of-month"
  | "day-of-week"
  | "first-working-day"
  | "last-working-day";

/**
 * A recurring expense or income (e.g. rent, salary). Materializes into real
 * entries on app open/focus, same trigger as automatic reports.
 *
 * `frequency`, `anchor` and `dayOfWeek` are optional, and `dayOfMonth` became
 * optional when they were added: rules stored before then (and JSON backups
 * from then) have no such keys, and `useLocalStorage` doesn't merge defaults
 * into a stored object. Absent `frequency`/`anchor` therefore mean "month" /
 * "day-of-month" — the only schedule that used to exist. Don't read these
 * fields directly; go through `resolveSchedule` in `lib/recurring.ts`, which
 * applies the defaults and reconciles invalid combinations in one place.
 */
export interface RecurringRule {
  id: string;
  kind: EntryKind;
  amount: number;
  currency: string;
  categoryId: string;
  note?: string;
  /** Absent = "month". */
  frequency?: RecurringFrequency;
  /** Absent = "day-of-month". */
  anchor?: RecurringAnchor;
  /** 1-31, only meaningful for the "day-of-month" anchor; clamped to the
   *  month's last day when it doesn't exist (e.g. 31 in April). */
  dayOfMonth?: number;
  /** 0 = Sunday .. 6 = Saturday, only meaningful for the "day-of-week" anchor. */
  dayOfWeek?: number;
  /** Local "YYYY-MM-DD"; occurrences before this date are never materialized. */
  startDate: string;
  /** Local "YYYY-MM-DD" of the most recent occurrence applied, if any. Only
   *  the *period* it falls in is load-bearing — see `dueDates`. */
  lastApplied?: string;
  enabled: boolean;
}

export interface Settings {
  /** ISO 4217 code used for combined totals and budgets. */
  baseCurrency: string;
  /**
   * UI language. Optional and absent-means-English, same as the appearance
   * fields below: settings saved before it existed have no such key, and
   * `useLocalStorage` doesn't merge defaults — so read sites fall back to "en".
   */
  language?: Language;
  /** Whether the user opted in to report notifications. */
  notificationsEnabled?: boolean;
  /**
   * Watermark: periods ending on or before this local "YYYY-MM-DD" are never
   * reported on. Set once on first run so existing history isn't backfilled.
   */
  reportsSince?: string;
  /**
   * Appearance. All three are optional: settings saved before theming existed
   * (and JSON backups from then) have no such keys, and `useLocalStorage`
   * doesn't merge defaults into a stored object — so every read site falls back
   * to the defaults in `lib/theme.ts`.
   */
  mode?: ThemeMode;
  themeColor?: ThemeColor;
  pattern?: ThemePattern;
  /**
   * Holiday calendar used to resolve the working-day anchors of recurring
   * rules. Both optional, same reason as the appearance fields above.
   * `holidayCountry` absent means no holiday calendar at all: working days are
   * then just Mon-Fri. `holidayRegion` absent means nationwide holidays only.
   */
  /** ISO 3166-1 alpha-2, e.g. "DE". */
  holidayCountry?: string;
  /** ISO 3166-2 subdivision, e.g. "DE-BY". */
  holidayRegion?: string;
}

export interface ReportCategoryTotal {
  categoryId: string;
  /**
   * Name and color as they were when the report was written. Frozen with the
   * rest of the snapshot: the category may later be renamed or deleted, and a
   * past report should still read the way it did the day it was produced.
   */
  name: string;
  color: string;
  amount: number;
}

/**
 * A frozen snapshot of one completed week or month. Totals are stored rather
 * than recomputed so a past report can't change value as FX rates drift.
 */
export interface Report {
  id: string;
  period: ReportPeriod;
  /** "YYYY-MM" for months, "W" + start date for weeks. Sorts chronologically. */
  periodKey: string;
  /** Inclusive local "YYYY-MM-DD" bounds of the period covered. */
  startDate: string;
  endDate: string;
  label: string;
  /** The base currency at generation time; totals below are in it. */
  baseCurrency: string;
  incomeTotal: number;
  expenseTotal: number;
  /** incomeTotal - expenseTotal. */
  net: number;
  /** Descending by amount; categories with no activity are omitted. */
  incomeByCategory: ReportCategoryTotal[];
  expenseByCategory: ReportCategoryTotal[];
  /** Net of the immediately preceding period, or null if it has no report. */
  prevNet: number | null;
  /** True if a rate was missing at generation, so totals are approximate. */
  approximate: boolean;
  generatedAt: string;
}

/** Map of currency code -> units of that currency per 1 base-currency unit. */
export type RateMap = Record<string, number>;

export interface CachedRates {
  base: string;
  rates: RateMap;
  /** ISO timestamp of when the rates were fetched. */
  fetchedAt: string;
}

/** One public holiday, narrowed to the fields the working-day math needs. */
export interface Holiday {
  /** Local "YYYY-MM-DD". */
  date: string;
  localName: string;
  /** False when the holiday only applies to the subdivisions in `counties`. */
  global: boolean;
  /** ISO 3166-2 codes, e.g. ["DE-BY"]. Absent for nationwide holidays. */
  counties?: string[];
}

/** One year of a country's calendar exceptions. */
export interface YearCalendar {
  holidays: Holiday[];
  /**
   * Weekend dates that are working days anyway — Taiwan's 補行上班 make-up days.
   * Empty for every country whose provider doesn't publish them.
   */
  workdays: string[];
}

/**
 * Calendars cached per country. Unlike FX rates these are near-immutable once
 * published, so there's no age-based expiry: the cache is valid as long as it
 * covers the country and years being asked about.
 */
export interface CachedHolidays {
  country: string;
  /** Year ("2026") -> that year's calendar. */
  years: Record<string, YearCalendar>;
  /** ISO timestamp of when the calendars were fetched. */
  fetchedAt: string;
}
