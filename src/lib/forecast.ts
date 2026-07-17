import type { DateRange } from "./dates";

const DAY_MS = 86_400_000;

export interface Projection {
  /** Total days in the period (inclusive). */
  totalDays: number;
  /** Days elapsed so far, capped at totalDays. */
  elapsedDays: number;
  /** Base-currency spend recorded so far in the period. */
  spentSoFar: number;
  /** spentSoFar / elapsedDays — the average daily burn so far. */
  dailyRate: number;
  /** Straight-line projection of the period total at the current pace. */
  projected: number;
}

/** Whole-day count between two local-midnight dates, inclusive of both ends. */
function inclusiveDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
}

/**
 * Straight-line run-rate projection for a period that is currently in progress.
 *
 * Returns `null` when `today` falls outside `[start, end]` — a completed or
 * future period has nothing to forecast (its actual total is the whole story).
 * Otherwise it scales the spend-so-far by remaining days: at the current daily
 * pace, this is where the period lands.
 */
export function projectPeriod(
  range: DateRange,
  today: Date,
  spentSoFar: number
): Projection | null {
  const t = today.getTime();
  if (t < range.start.getTime() || t > range.end.getTime()) return null;

  const totalDays = inclusiveDays(range.start, range.end);
  const elapsedDays = Math.min(inclusiveDays(range.start, today), totalDays);
  const dailyRate = elapsedDays > 0 ? spentSoFar / elapsedDays : 0;

  return {
    totalDays,
    elapsedDays,
    spentSoFar,
    dailyRate,
    projected: dailyRate * totalDays,
  };
}
