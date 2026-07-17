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

export interface CategoryDelta {
  categoryId: string;
  current: number;
  previous: number;
  /** current - previous; positive means more spent than last period. */
  delta: number;
}

/**
 * Per-category change between two already-computed base-currency total maps
 * (e.g. this period vs the previous one). Every category present on either
 * side appears; sorted by the magnitude of the change, biggest movers first.
 */
export function diffByCategory(
  current: Record<string, number>,
  previous: Record<string, number>
): CategoryDelta[] {
  const ids = new Set([...Object.keys(current), ...Object.keys(previous)]);
  const out: CategoryDelta[] = [];
  for (const categoryId of ids) {
    const cur = current[categoryId] ?? 0;
    const prev = previous[categoryId] ?? 0;
    out.push({ categoryId, current: cur, previous: prev, delta: cur - prev });
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export interface EntryStats {
  /** Number of entries. */
  count: number;
  /** Total in base currency. */
  total: number;
  /** total / count, or 0 when count === 0. */
  mean: number;
  /** Middle converted amount (average of the two middles for an even count). */
  median: number;
  /** Largest single converted amount. */
  max: number;
}

/**
 * Distribution stats for a set of entries, in the base currency — count, total,
 * mean, median and max. Unlike a bare total these expose the *shape* of spend:
 * a mean of 80 reads very differently once you can see the median and the
 * largest single hit next to it.
 */
export function statsInBase(
  entries: Entry[],
  base: string,
  rates: RateMap
): EntryStats {
  const amounts = entries
    .map((e) => convert(e.amount, e.currency, base, rates) ?? e.amount)
    .sort((a, b) => a - b);
  const count = amounts.length;
  if (count === 0) return { count: 0, total: 0, mean: 0, median: 0, max: 0 };
  const total = amounts.reduce((s, v) => s + v, 0);
  const mid = Math.floor(count / 2);
  const median =
    count % 2 === 0 ? (amounts[mid - 1] + amounts[mid]) / 2 : amounts[mid];
  return { count, total, mean: total / count, median, max: amounts[count - 1] };
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
