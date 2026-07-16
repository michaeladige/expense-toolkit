import { toISODate } from "./dates";

/** Local "YYYY-MM-DD" dates that are public holidays. */
export type HolidaySet = ReadonlySet<string>;

/**
 * A working day is Mon-Fri and not a public holiday. The weekend is fixed to
 * Sat/Sun rather than derived from the holiday country: holiday providers don't
 * publish weekend days, so a per-region weekend would need its own table.
 *
 * An empty `holidays` set degrades this to "any weekday", which is what a rule
 * falls back to when no country is configured or the fetch failed.
 */
export function isWorkingDay(d: Date, holidays: HolidaySet): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  return !holidays.has(toISODate(d));
}

/**
 * The earliest working day in the inclusive range, or null if it has none.
 *
 * Null is reachable for a week whose every weekday is a holiday, so callers
 * must treat it as "no occurrence this period" and move on. It can't happen for
 * a calendar month.
 */
export function firstWorkingDay(
  start: Date,
  end: Date,
  holidays: HolidaySet
): Date | null {
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    if (isWorkingDay(cursor, holidays)) return new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

/** The latest working day in the inclusive range, or null if it has none. */
export function lastWorkingDay(
  start: Date,
  end: Date,
  holidays: HolidaySet
): Date | null {
  const cursor = new Date(end);
  while (cursor.getTime() >= start.getTime()) {
    if (isWorkingDay(cursor, holidays)) return new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return null;
}
