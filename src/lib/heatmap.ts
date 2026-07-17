import type { Expense, RateMap } from "../types";
import { convert } from "./currency";
import { getRange, shiftPeriod, todayISO, toISODate } from "./dates";

/** Number of intensity levels above zero (GitHub-style 1..4, plus 0 for none). */
export const HEATMAP_LEVELS = 4;

/** All-time spend per local ISO date, converted to the base currency. */
export function buildDailyTotals(
  expenses: Expense[],
  base: string,
  rates: RateMap
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of expenses) {
    const amount = convert(e.amount, e.currency, base, rates) ?? e.amount;
    out[e.date] = (out[e.date] ?? 0) + amount;
  }
  return out;
}

export interface HeatmapCell {
  /** Local ISO date this cell represents. */
  date: string;
  /** Spend total for the day, in base currency. */
  total: number;
  /** 0 (no spend) … HEATMAP_LEVELS. */
  level: number;
  /** True when the date is after today — nothing has happened yet. */
  future: boolean;
}

export interface HeatmapWeek {
  /** Monday of the week (the column). */
  weekStart: Date;
  /** Seven cells, Monday → Sunday. */
  days: HeatmapCell[];
}

export interface HeatmapGrid {
  weeks: HeatmapWeek[];
  /** Largest single-day total across the window; 0 when there's no spend. */
  maxTotal: number;
}

/** Linearly-interpolated quantile of a sorted-ascending array. */
function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * The last `weeks` Monday-start columns ending with the week containing `ref`,
 * oldest column first. Each day's intensity `level` is quantised against the
 * distribution of non-zero daily totals, so the scale adapts to the user's own
 * spending rather than an absolute currency threshold.
 */
export function buildHeatmapGrid(
  dailyTotals: Record<string, number>,
  weeks: number,
  ref: Date
): HeatmapGrid {
  const nonZero = Object.values(dailyTotals)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const maxTotal = nonZero.length ? nonZero[nonZero.length - 1] : 0;
  // Quartile cut points of the non-zero distribution.
  const cuts = [0.25, 0.5, 0.75].map((p) => quantile(nonZero, p));
  const today = todayISO();

  const levelOf = (total: number): number => {
    if (total <= 0) return 0;
    let level = HEATMAP_LEVELS;
    for (let i = 0; i < cuts.length; i++) {
      if (total <= cuts[i]) {
        level = i + 1;
        break;
      }
    }
    return level;
  };

  // Monday of the most recent (rightmost) column.
  const lastMonday = getRange("week", ref).start;
  const out: HeatmapWeek[] = [];
  for (let col = weeks - 1; col >= 0; col--) {
    let weekStart = lastMonday;
    for (let k = 0; k < col; k++) weekStart = shiftPeriod("week", weekStart, -1);
    const days: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      const iso = toISODate(date);
      const total = dailyTotals[iso] ?? 0;
      days.push({ date: iso, total, level: levelOf(total), future: iso > today });
    }
    out.push({ weekStart, days });
  }

  return { weeks: out, maxTotal };
}
