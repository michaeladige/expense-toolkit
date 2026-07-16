import { toISODate } from "./dates";

/**
 * The exceptions to a Mon-Fri working week, as local "YYYY-MM-DD" dates.
 *
 * Two sets rather than one, because a public calendar moves days in both
 * directions: Taiwan (and other countries that bridge holidays) designates
 * make-up working Saturdays — 補行上班 — to pay back a long weekend. A single
 * holiday set couldn't express that, and hard-coding "Sat/Sun are never working
 * days" would silently mis-date rules on exactly those days.
 */
export interface WorkCalendar {
  /** Weekdays that are not working days. */
  holidays: ReadonlySet<string>;
  /** Weekend days that *are* working days. Empty for most countries. */
  workdays: ReadonlySet<string>;
}

export const EMPTY_CALENDAR: WorkCalendar = {
  holidays: new Set(),
  workdays: new Set(),
};

/**
 * A working day is Mon-Fri and not a holiday, unless the calendar explicitly
 * designates it a make-up working day — that overrides the weekend, since it's
 * a deliberate government designation rather than an inference.
 *
 * An empty calendar degrades this to "any weekday", which is what a rule falls
 * back to when no country is configured or the fetch failed.
 */
export function isWorkingDay(d: Date, calendar: WorkCalendar): boolean {
  const iso = toISODate(d);
  if (calendar.workdays.has(iso)) return true;
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  return !calendar.holidays.has(iso);
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
  calendar: WorkCalendar
): Date | null {
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    if (isWorkingDay(cursor, calendar)) return new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

/** The latest working day in the inclusive range, or null if it has none. */
export function lastWorkingDay(
  start: Date,
  end: Date,
  calendar: WorkCalendar
): Date | null {
  const cursor = new Date(end);
  while (cursor.getTime() >= start.getTime()) {
    if (isWorkingDay(cursor, calendar)) return new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return null;
}
