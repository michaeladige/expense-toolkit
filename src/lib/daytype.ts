import type { Expense, RateMap } from "../types";
import type { WorkCalendar } from "./workdays";
import { convert } from "./currency";
import { fromISODate, toISODate } from "./dates";

/** The three day types spending is split across. */
export type DayType = "weekday" | "weekend" | "holiday";

export const DAY_TYPES: readonly DayType[] = ["weekday", "weekend", "holiday"];

/**
 * Classify a date, reusing WorkCalendar semantics so this stays consistent
 * with the working-day / recurring logic:
 *   - an explicit make-up working day (Taiwan 補行上班) is a weekday
 *   - otherwise Sat/Sun is a weekend (a public holiday landing on a weekend
 *     stays "weekend" — it was already a day off)
 *   - otherwise a holiday date is a holiday
 *   - otherwise a plain weekday
 */
export function classifyDay(date: Date, calendar: WorkCalendar): DayType {
  const iso = toISODate(date);
  if (calendar.workdays.has(iso)) return "weekday";
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return "weekend";
  if (calendar.holidays.has(iso)) return "holiday";
  return "weekday";
}

export interface DayTypeStat {
  type: DayType;
  /** Base-currency total spent on days of this type. */
  total: number;
  /** Distinct dates of this type with at least one expense. */
  activeDays: number;
  /** total / activeDays, or 0 when activeDays === 0. */
  average: number;
  /** total / grandTotal, or 0 when grandTotal === 0. */
  share: number;
}

export interface DayTypeBreakdown {
  stats: Record<DayType, DayTypeStat>;
  grandTotal: number;
  /**
   * True when at least one expense falls in a year outside `knownYears` while a
   * holiday country is configured — its holiday status is unknown, so the
   * holiday split is approximate. Not set when no country is configured (a
   * missing holiday split is then expected, not approximate).
   */
  approximate: boolean;
  /** True when a holiday country is configured (knownYears non-empty). */
  holidaysKnown: boolean;
}

/**
 * Split all-time expenses into weekday / weekend / holiday, in the base
 * currency. Per-day average uses the count of distinct days of that type that
 * actually had spending, not every such day in history — it answers "when I
 * spend on this kind of day, how much?".
 */
export function buildDayTypeBreakdown(
  expenses: Expense[],
  calendar: WorkCalendar,
  knownYears: ReadonlySet<number>,
  base: string,
  rates: RateMap
): DayTypeBreakdown {
  const totals: Record<DayType, number> = { weekday: 0, weekend: 0, holiday: 0 };
  const days: Record<DayType, Set<string>> = {
    weekday: new Set(),
    weekend: new Set(),
    holiday: new Set(),
  };
  let grandTotal = 0;
  let approximate = false;
  const holidaysKnown = knownYears.size > 0;

  for (const e of expenses) {
    const date = fromISODate(e.date);
    const type = classifyDay(date, calendar);
    const amount = convert(e.amount, e.currency, base, rates) ?? e.amount;
    totals[type] += amount;
    days[type].add(e.date);
    grandTotal += amount;
    if (holidaysKnown && !knownYears.has(date.getFullYear())) approximate = true;
  }

  const stats = {} as Record<DayType, DayTypeStat>;
  for (const type of DAY_TYPES) {
    const total = totals[type];
    const activeDays = days[type].size;
    stats[type] = {
      type,
      total,
      activeDays,
      average: activeDays > 0 ? total / activeDays : 0,
      share: grandTotal > 0 ? total / grandTotal : 0,
    };
  }

  return { stats, grandTotal, approximate, holidaysKnown };
}
