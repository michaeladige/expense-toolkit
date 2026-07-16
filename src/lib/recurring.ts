import type { RecurringRule } from "../types";
import { fromISODate, toISODate } from "./dates";

/**
 * Most occurrences materialized in a single pass. Without a cap, a rule left
 * disabled-then-re-enabled after a long absence couldn't flood the entry list —
 * mirrors reports.ts's BACKFILL_CAP.
 */
const BACKFILL_CAP = 12;

function clampedDay(year: number, month: number, dayOfMonth: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(dayOfMonth, lastDay);
}

function occurrence(year: number, month: number, dayOfMonth: number): Date {
  return new Date(year, month, clampedDay(year, month, dayOfMonth));
}

/**
 * Occurrences that are due (on or before `now`) but not yet applied: strictly
 * after `rule.lastApplied` (or on/after `rule.startDate` if never applied),
 * oldest first, capped so a long absence can't flood the entry list.
 */
export function dueDates(rule: RecurringRule, now: Date, cap: number = BACKFILL_CAP): string[] {
  if (!rule.enabled) return [];

  const todayISO = toISODate(now);
  const after = rule.lastApplied ? fromISODate(rule.lastApplied) : null;

  let year: number;
  let month: number;
  if (after) {
    year = after.getFullYear();
    month = after.getMonth();
  } else {
    const start = fromISODate(rule.startDate);
    year = start.getFullYear();
    month = start.getMonth();
  }

  const out: string[] = [];
  for (let i = 0; i < cap; i++) {
    const occ = occurrence(year, month, rule.dayOfMonth);
    const occISO = toISODate(occ);
    if (occISO > todayISO) break;

    const isAfterLastApplied = !after || occ.getTime() > after.getTime();
    if (isAfterLastApplied && occISO >= rule.startDate) out.push(occISO);

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return out;
}

/**
 * The next occurrence not yet applied, which may already be due (if the app
 * hasn't been opened since) or still upcoming. Used for the "next due" UI.
 */
export function nextDue(rule: RecurringRule, now: Date): string {
  let year = now.getFullYear();
  let month = now.getMonth();

  for (let i = 0; i < 24; i++) {
    const occISO = toISODate(occurrence(year, month, rule.dayOfMonth));
    const isAfterLastApplied = !rule.lastApplied || occISO > rule.lastApplied;
    if (isAfterLastApplied && occISO >= rule.startDate) return occISO;

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  // Unreachable in practice — 24 months always finds an unapplied occurrence.
  return rule.startDate;
}
