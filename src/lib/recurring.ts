import type { RecurringAnchor, RecurringFrequency, RecurringRule } from "../types";
import { fromISODate, getRange, shiftPeriod, toISODate } from "./dates";
import { firstWorkingDay, lastWorkingDay, type HolidaySet } from "./workdays";

/**
 * Most occurrences materialized in a single pass. Without a cap, a rule left
 * disabled-then-re-enabled after a long absence couldn't flood the entry list —
 * mirrors reports.ts's BACKFILL_CAP. Per frequency so both mean roughly the
 * same wall-clock dormancy: a year of months, half a year of weeks. This caps
 * the flood, not completeness — a longer gap simply takes several passes.
 */
const BACKFILL_CAPS: Record<RecurringFrequency, number> = { month: 12, week: 26 };

/** How far `nextDue` scans before giving up. Only a runaway guard. */
const LOOKAHEAD: Record<RecurringFrequency, number> = { month: 24, week: 104 };

export interface ResolvedSchedule {
  frequency: RecurringFrequency;
  anchor: RecurringAnchor;
  /** 1-31. Meaningful only when anchor is "day-of-month". */
  dayOfMonth: number;
  /** 0 = Sunday .. 6 = Saturday. Meaningful only when anchor is "day-of-week". */
  dayOfWeek: number;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/**
 * A rule's schedule with every optional field defaulted and every invalid
 * combination reconciled. The single place those decisions are made: `dueDates`,
 * `nextDue` and the UI all route through it, which is what keeps the date the
 * panel advertises identical to the date that actually fires.
 *
 * Absent `frequency`/`anchor` mean month/day-of-month — the only schedule that
 * existed before they were added, so pre-existing rules and old backups keep
 * their behavior.
 */
export function resolveSchedule(rule: RecurringRule): ResolvedSchedule {
  const frequency = rule.frequency ?? "month";
  let anchor: RecurringAnchor = rule.anchor ?? "day-of-month";

  // Each frequency has exactly one "specific day" anchor, and the two crossed
  // pairings are unreachable from the form but reachable via a hand-edited
  // backup or a partial update (`updateRecurring` is a naive spread and can't
  // hold the invariant). Map to the other side's equivalent rather than
  // dropping the rule — silently killing it would be worse than a fair guess.
  if (frequency === "week" && anchor === "day-of-month") anchor = "day-of-week";
  if (frequency === "month" && anchor === "day-of-week") anchor = "day-of-month";

  return {
    frequency,
    anchor,
    dayOfMonth: clamp(rule.dayOfMonth ?? 1, 1, 31),
    dayOfWeek: clamp(rule.dayOfWeek ?? 1, 0, 6),
  };
}

/** True when the occurrence date depends on holiday data. */
export function isWorkingDayAnchor(anchor: RecurringAnchor): boolean {
  return anchor === "first-working-day" || anchor === "last-working-day";
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Human-readable schedule, e.g. "Day 15 of month" or "Last working day of week".
 * Built from `resolveSchedule` so the copy can't drift from what actually fires
 * — the old panel read `rule.dayOfMonth` directly and would render "Day  of
 * month" for any rule that doesn't have one.
 */
export function describeSchedule(rule: RecurringRule): string {
  const schedule = resolveSchedule(rule);
  const unit = schedule.frequency === "week" ? "week" : "month";
  switch (schedule.anchor) {
    case "day-of-month":
      return `Day ${schedule.dayOfMonth} of month`;
    case "day-of-week":
      return `Every ${WEEKDAY_NAMES[schedule.dayOfWeek]}`;
    case "first-working-day":
      return `First working day of ${unit}`;
    case "last-working-day":
      return `Last working day of ${unit}`;
  }
}

/** Normalize any date to the first day of the period containing it. */
function periodStart(frequency: RecurringFrequency, d: Date): Date {
  return getRange(frequency, d).start;
}

/** The period after the one containing `cursor`. */
function nextPeriod(frequency: RecurringFrequency, cursor: Date): Date {
  return periodStart(frequency, shiftPeriod(frequency, cursor, 1));
}

/**
 * The date a rule falls on within one period, or null when the period has no
 * working day at all (possible for a week of holidays, not for a month).
 *
 * `start` must be a period start — the caller keeps the cursor pinned there so
 * the month arithmetic can't skip (shifting a month forward from the 31st lands
 * two months on; same trap reports.ts documents).
 */
function occurrenceFor(
  schedule: ResolvedSchedule,
  start: Date,
  holidays: HolidaySet
): Date | null {
  const range = getRange(schedule.frequency, start);
  switch (schedule.anchor) {
    case "day-of-month": {
      // range.end is the month's last day, so this clamps 29-31 into short months.
      const day = Math.min(schedule.dayOfMonth, range.end.getDate());
      return new Date(range.start.getFullYear(), range.start.getMonth(), day);
    }
    case "day-of-week": {
      // range.start is the week's Monday (the app's week convention).
      const offsetFromMonday = (schedule.dayOfWeek + 6) % 7;
      const d = new Date(range.start);
      d.setDate(range.start.getDate() + offsetFromMonday);
      return d;
    }
    case "first-working-day":
      return firstWorkingDay(range.start, range.end, holidays);
    case "last-working-day":
      return lastWorkingDay(range.start, range.end, holidays);
  }
}

/**
 * Where to resume evaluating a rule: the period after the one `lastApplied`
 * fell in, or the period containing `startDate` if it never applied.
 *
 * The watermark is the *period*, not the date. Working-day occurrences are
 * computed from holiday data, so an already-applied period's date can move
 * between passes (cache cleared, country switched, a fetch that failed this
 * time) — and a date comparison would then see a later date and fire the same
 * period twice. Skipping the applied period entirely is immune to that. It also
 * means an edit to the day/anchor takes effect from the next period rather than
 * firing a second time in the current one.
 */
function resumeFrom(rule: RecurringRule, frequency: RecurringFrequency): Date {
  if (!rule.lastApplied) return periodStart(frequency, fromISODate(rule.startDate));
  return nextPeriod(frequency, periodStart(frequency, fromISODate(rule.lastApplied)));
}

/**
 * Occurrences that are due (on or before `now`) but not yet applied, oldest
 * first, capped so a long absence can't flood the entry list.
 *
 * `holidays` may be empty — a rule with a working-day anchor then resolves
 * against weekends only. Callers must not let that happen while a holiday fetch
 * is still in flight (see `useRecurring`): entries are frozen once written, so
 * a premature pass would permanently date one on a holiday.
 */
export function dueDates(
  rule: RecurringRule,
  now: Date,
  holidays: HolidaySet,
  cap?: number
): string[] {
  if (!rule.enabled) return [];

  const schedule = resolveSchedule(rule);
  const limit = cap ?? BACKFILL_CAPS[schedule.frequency];
  const todayISO = toISODate(now);

  let cursor = resumeFrom(rule, schedule.frequency);
  const out: string[] = [];

  for (let i = 0; i < limit; i++) {
    // Bound the walk by the period, not the occurrence: an occurrence can be
    // null, and testing it would stop a rule forever on a holiday-only week.
    if (toISODate(cursor) > todayISO) break;

    const occ = occurrenceFor(schedule, cursor, holidays);
    if (occ) {
      const occISO = toISODate(occ);
      if (occISO <= todayISO && occISO >= rule.startDate) out.push(occISO);
    }
    cursor = nextPeriod(schedule.frequency, cursor);
  }
  return out;
}

/**
 * The next occurrence not yet applied, which may already be due (if the app
 * hasn't been opened since) or still upcoming. Used for the "next due" UI.
 * Null when none could be found within the lookahead — reachable only for a
 * pathological run of periods with no working day.
 *
 * Deliberately derived from the same watermark and cursor as `dueDates` rather
 * than from wall-clock now: it must name the date that will actually be
 * written, not a date that has already been skipped past.
 */
export function nextDue(rule: RecurringRule, holidays: HolidaySet): string | null {
  const schedule = resolveSchedule(rule);
  let cursor = resumeFrom(rule, schedule.frequency);

  for (let i = 0; i < LOOKAHEAD[schedule.frequency]; i++) {
    const occ = occurrenceFor(schedule, cursor, holidays);
    if (occ) {
      const occISO = toISODate(occ);
      if (occISO >= rule.startDate) return occISO;
    }
    cursor = nextPeriod(schedule.frequency, cursor);
  }
  return null;
}
