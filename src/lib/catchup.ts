import type { DateRange } from "./dates";
import { fromISODate, toISODate } from "./dates";

/**
 * Shortest run of consecutive unlogged days that counts as "fell behind".
 * Shorter runs are ordinary quiet days, not worth a banner — and since a
 * missing run also holds back reports, flagging every single day off would
 * delay reports for people who simply didn't spend.
 */
export const MIN_GAP_RUN = 3;

/**
 * How far back gaps are looked for. Bounds the catch-up walk to something a
 * person can plausibly remember, and means an ignored gap eventually ages out
 * on its own instead of holding reports back forever.
 */
export const LOOKBACK_DAYS = 60;

interface DatedEntry {
  date: string;
  /** Set on entries a recurring rule wrote — those don't mean the user was here. */
  recurringId?: string;
}

/**
 * Days the user actually accounted for: any hand-entered expense or income,
 * plus days explicitly marked "no spending". Recurring entries are excluded —
 * rent landing on its own says nothing about whether you logged that day, and
 * counting it would hide exactly the gaps this feature exists to surface.
 */
export function loggedDays(
  expenses: DatedEntry[],
  incomes: DatedEntry[],
  noSpendDays: readonly string[] = []
): Set<string> {
  const out = new Set<string>(noSpendDays);
  for (const e of expenses) if (!e.recurringId) out.add(e.date);
  for (const e of incomes) if (!e.recurringId) out.add(e.date);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export interface FindMissingArgs {
  expenses: DatedEntry[];
  incomes: DatedEntry[];
  noSpendDays?: readonly string[];
  skippedThrough?: string;
  now: Date;
}

/**
 * Unlogged days the user should catch up on, oldest first: every day in a run
 * of at least `MIN_GAP_RUN` consecutive unlogged days, within the lookback
 * window, up to and including yesterday.
 *
 * Runs rather than "everything since the last entry": logging today's coffee
 * must not silently close a two-week hole behind it, and filling one day in
 * the middle of a gap shouldn't hide the rest of it either.
 *
 * Nothing before the user's first hand-entered entry is ever missing (they
 * weren't using the app yet), nor anything on or before `skippedThrough`.
 * Today is excluded — it isn't over.
 */
export function findMissingDays({
  expenses,
  incomes,
  noSpendDays,
  skippedThrough,
  now,
}: FindMissingArgs): string[] {
  const logged = loggedDays(expenses, incomes, noSpendDays);

  let first: string | null = null;
  for (const e of [...expenses, ...incomes]) {
    if (e.recurringId) continue;
    if (first == null || e.date < first) first = e.date;
  }
  if (first == null) return [];

  const today = fromISODate(toISODate(now));
  const yesterday = addDays(today, -1);

  let start = addDays(today, -LOOKBACK_DAYS);
  const firstDay = fromISODate(first);
  if (firstDay > start) start = firstDay;
  if (skippedThrough) {
    const afterSkip = addDays(fromISODate(skippedThrough), 1);
    if (afterSkip > start) start = afterSkip;
  }

  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= MIN_GAP_RUN) out.push(...run);
    run = [];
  };
  for (let d = start; d <= yesterday; d = addDays(d, 1)) {
    const iso = toISODate(d);
    if (logged.has(iso)) flush();
    else run.push(iso);
  }
  flush();
  return out;
}

/** True if any missing day falls inside the range — i.e. a report for this
 *  period would be built from data the user hasn't finished entering. */
export function rangeHasMissingDay(
  range: DateRange,
  missing: ReadonlySet<string>
): boolean {
  for (let d = new Date(range.start); d <= range.end; d = addDays(d, 1)) {
    if (missing.has(toISODate(d))) return true;
  }
  return false;
}
