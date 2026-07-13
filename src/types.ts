export type PeriodType = "day" | "week" | "month";

export interface Expense {
  id: string;
  /** Amount in the expense's own currency. */
  amount: number;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  categoryId: string;
  /** "YYYY-MM-DD" (local date the expense occurred). */
  date: string;
  note?: string;
  /** ISO timestamp of creation. */
  createdAt: string;
}

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

export interface Settings {
  /** ISO 4217 code used for combined totals and budgets. */
  baseCurrency: string;
}

/** Map of currency code -> units of that currency per 1 base-currency unit. */
export type RateMap = Record<string, number>;

export interface CachedRates {
  base: string;
  rates: RateMap;
  /** ISO timestamp of when the rates were fetched. */
  fetchedAt: string;
}
