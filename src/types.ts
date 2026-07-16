import type { ThemeColor, ThemeMode, ThemePattern } from "./lib/theme";

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

/**
 * A monthly recurring expense or income (e.g. rent, salary). Materializes
 * into real entries on app open/focus, same trigger as automatic reports.
 */
export interface RecurringRule {
  id: string;
  kind: EntryKind;
  amount: number;
  currency: string;
  categoryId: string;
  note?: string;
  /** 1-31; clamped to the month's last day when it doesn't exist (e.g. 31 in April). */
  dayOfMonth: number;
  /** Local "YYYY-MM-DD"; occurrences before this date are never materialized. */
  startDate: string;
  /** Local "YYYY-MM-DD" of the most recent occurrence applied, if any. */
  lastApplied?: string;
  enabled: boolean;
}

export interface Settings {
  /** ISO 4217 code used for combined totals and budgets. */
  baseCurrency: string;
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
