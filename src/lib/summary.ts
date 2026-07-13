import type { Expense, RateMap } from "../types";
import { convert } from "./currency";

/** Subtotal of expenses grouped by their own currency (no conversion). */
export function sumByCurrency(expenses: Expense[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    out[e.currency] = (out[e.currency] ?? 0) + e.amount;
  }
  return out;
}

export interface BaseTotal {
  total: number;
  /** True if at least one expense could not be converted (missing rate). */
  missing: boolean;
}

/** Total of all expenses converted into the base currency. */
export function totalInBase(
  expenses: Expense[],
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

/** Sum of expenses per category id, converted to the base currency. */
export function sumByCategoryInBase(
  expenses: Expense[],
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
 * Total spend per "YYYY-MM" month key, converted to the base currency. Only
 * months with at least one expense appear as keys.
 */
export function totalsByMonthInBase(
  expenses: Expense[],
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
