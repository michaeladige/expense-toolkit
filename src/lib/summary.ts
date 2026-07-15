import type { Entry, RateMap } from "../types";
import { convert } from "./currency";

/**
 * These helpers take `Entry`, the shape expenses and income share, so both
 * sides aggregate through the same code.
 */

/** Subtotal of entries grouped by their own currency (no conversion). */
export function sumByCurrency(expenses: Entry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    out[e.currency] = (out[e.currency] ?? 0) + e.amount;
  }
  return out;
}

export interface BaseTotal {
  total: number;
  /** True if at least one entry could not be converted (missing rate). */
  missing: boolean;
}

/** Total of all entries converted into the base currency. */
export function totalInBase(
  expenses: Entry[],
  base: string,
  rates: RateMap
): BaseTotal {
  let total = 0;
  let missing = false;
  for (const e of expenses) {
    const c = convert(e.amount, e.currency, base, rates);
    if (c == null) {
      missing = true;
      total += e.amount; // best-effort fallback
    } else {
      total += c;
    }
  }
  return { total, missing };
}

/** Sum of entries per category id, converted to the base currency. */
export function sumByCategoryInBase(
  expenses: Entry[],
  base: string,
  rates: RateMap
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    const c = convert(e.amount, e.currency, base, rates) ?? e.amount;
    out[e.categoryId] = (out[e.categoryId] ?? 0) + c;
  }
  return out;
}

/**
 * Total per "YYYY-MM" month key, converted to the base currency. Only months
 * with at least one entry appear as keys.
 */
export function totalsByMonthInBase(
  expenses: Entry[],
  base: string,
  rates: RateMap
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    const c = convert(e.amount, e.currency, base, rates) ?? e.amount;
    out[key] = (out[key] ?? 0) + c;
  }
  return out;
}

export interface NetTotal {
  income: number;
  expense: number;
  /** income - expense; negative means overspending. */
  net: number;
  /** True if either side had an unconvertible amount, so net is approximate. */
  missing: boolean;
}

/** Income, expense, and net totals for one set of entries, in the base currency. */
export function netInBase(
  incomes: Entry[],
  expenses: Entry[],
  base: string,
  rates: RateMap
): NetTotal {
  const inc = totalInBase(incomes, base, rates);
  const exp = totalInBase(expenses, base, rates);
  return {
    income: inc.total,
    expense: exp.total,
    net: inc.total - exp.total,
    missing: inc.missing || exp.missing,
  };
}
