import type { PeriodType } from "../types";

/** Format a Date as a local "YYYY-MM-DD" string. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a "YYYY-MM-DD" string into a local Date at midnight. */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday-based start of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const dow = (s.getDay() + 6) % 7; // 0 = Monday
  s.setDate(s.getDate() - dow);
  return s;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export interface DateRange {
  /** Inclusive start (local midnight). */
  start: Date;
  /** Inclusive end (local midnight of the last day). */
  end: Date;
}

/** Compute the inclusive [start, end] day range for a period around `ref`. */
export function getRange(period: PeriodType, ref: Date): DateRange {
  switch (period) {
    case "day": {
      const s = startOfDay(ref);
      return { start: s, end: s };
    }
    case "week": {
      const s = startOfWeek(ref);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      return { start: s, end: e };
    }
    case "month": {
      const s = startOfMonth(ref);
      const e = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      return { start: s, end: e };
    }
  }
}

/** Move the reference date forward/backward by one period. */
export function shiftPeriod(period: PeriodType, ref: Date, dir: 1 | -1): Date {
  const d = new Date(ref);
  if (period === "day") d.setDate(d.getDate() + dir);
  else if (period === "week") d.setDate(d.getDate() + dir * 7);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

/** True if an ISO date string falls within the inclusive range. */
export function isWithinRange(dateISO: string, range: DateRange): boolean {
  const d = fromISODate(dateISO).getTime();
  return d >= range.start.getTime() && d <= range.end.getTime();
}

/** ISO date range for the calendar month containing `ref` (used by budgets). */
export function monthKey(ref: Date): { start: string; end: string } {
  const { start, end } = getRange("month", ref);
  return { start: toISODate(start), end: toISODate(end) };
}

/** Human-friendly label for the current period selection. */
export function formatPeriodLabel(period: PeriodType, ref: Date): string {
  const { start, end } = getRange(period, ref);
  if (period === "day") {
    return start.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (period === "month") {
    return start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  // week
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, {
    ...opts,
    year: sameYear ? undefined : "numeric",
  });
  return `${startStr} – ${endStr}, ${end.getFullYear()}`;
}
