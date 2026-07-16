import type { Expense, RateMap } from "../types";
import type { WorkCalendar } from "./workdays";
import type { DayTypePhrases } from "./i18n/types";
import { convert } from "./currency";
import { fromISODate, toISODate } from "./dates";

/** The two day types spending is split across: working days vs days off. */
export type DayType = "workday" | "dayoff";

export const DAY_TYPES: readonly DayType[] = ["workday", "dayoff"];

/**
 * Classify a date, reusing WorkCalendar semantics so this stays consistent
 * with the working-day / recurring logic. Weekends and public holidays are
 * both "days off"; only a plain weekday (or an explicit Taiwan 補行上班 make-up
 * day) counts as a working day:
 *   - an explicit make-up working day is a workday
 *   - otherwise Sat/Sun is a day off
 *   - otherwise a public holiday is a day off
 *   - otherwise a plain weekday is a workday
 */
export function classifyDay(date: Date, calendar: WorkCalendar): DayType {
  const iso = toISODate(date);
  if (calendar.workdays.has(iso)) return "workday";
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return "dayoff";
  if (calendar.holidays.has(iso)) return "dayoff";
  return "workday";
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

/** One expense category's total, split across the two day types. */
export interface CategoryDayTypeStat {
  categoryId: string;
  /** Base-currency total across both day types. */
  total: number;
  byType: Record<DayType, number>;
}

export interface DayTypeBreakdown {
  stats: Record<DayType, DayTypeStat>;
  /** Per-category split, sorted by total spend descending. */
  categories: CategoryDayTypeStat[];
  grandTotal: number;
  /**
   * True when a holiday country is configured but at least one expense falls in
   * a year outside `knownYears`: its holiday status is unknown, so a weekday
   * holiday there is miscounted as a workday and the split is approximate. Not
   * set when no country is configured (a holiday landing on a weekday then just
   * reads as a workday, which is the documented Mon–Fri fallback).
   */
  approximate: boolean;
}

/**
 * Split all-time expenses into working days vs days off, in the base currency,
 * with a per-category breakdown alongside. Per-day average uses the count of
 * distinct days of that type that actually had spending, not every such day in
 * history — it answers "when I spend on this kind of day, how much?".
 */
export function buildDayTypeBreakdown(
  expenses: Expense[],
  calendar: WorkCalendar,
  knownYears: ReadonlySet<number>,
  base: string,
  rates: RateMap
): DayTypeBreakdown {
  const totals: Record<DayType, number> = { workday: 0, dayoff: 0 };
  const days: Record<DayType, Set<string>> = {
    workday: new Set(),
    dayoff: new Set(),
  };
  const catMap = new Map<string, CategoryDayTypeStat>();
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

    let cat = catMap.get(e.categoryId);
    if (!cat) {
      cat = { categoryId: e.categoryId, total: 0, byType: { workday: 0, dayoff: 0 } };
      catMap.set(e.categoryId, cat);
    }
    cat.total += amount;
    cat.byType[type] += amount;

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

  const categories = [...catMap.values()].sort((a, b) => b.total - a.total);

  return { stats, categories, grandTotal, approximate };
}

/** True when any day type recorded spending — the card's non-empty gate. */
export function hasActivity(b: DayTypeBreakdown): boolean {
  return b.grandTotal > 0;
}

/** The day type with the highest per-day average, among those with activity. */
function topByAverage(b: DayTypeBreakdown): DayTypeStat | null {
  const active = DAY_TYPES.map((t) => b.stats[t]).filter((s) => s.activeDays > 0);
  if (active.length === 0) return null;
  return active.reduce((hi, s) => (s.average > hi.average ? s : hi));
}

/** The other day type, if it also has activity. */
function runnerUp(b: DayTypeBreakdown, top: DayTypeStat): DayTypeStat | null {
  const rest = DAY_TYPES.map((t) => b.stats[t]).filter(
    (s) => s.activeDays > 0 && s.type !== top.type
  );
  if (rest.length === 0) return null;
  return rest.reduce((hi, s) => (s.average > hi.average ? s : hi));
}

/**
 * Stable index into a variant list from the rounded stats, so the chosen line
 * doesn't flicker between renders (the breakdown object is recomputed each
 * render, but its rounded numbers are stable).
 */
function pick<T>(options: readonly T[], seed: number): T {
  const i = Math.abs(Math.round(seed)) % options.length;
  return options[i];
}

/**
 * A one-line, tongue-in-cheek read of the spending shape. Deterministic: no
 * randomness, no network. Copy comes from the active language's `phrases`
 * bank, so the humour follows the UI language.
 */
export function verdictLine(b: DayTypeBreakdown, phrases: DayTypePhrases): string {
  const top = topByAverage(b);
  if (!top) return "";
  const seed = Math.round(b.grandTotal);
  const other = runnerUp(b, top);
  if (!other) return pick(phrases.single[top.type], seed);

  const ratio = other.average > 0 ? top.average / other.average : Infinity;
  const topNoun = phrases.noun[top.type];
  const otherNoun = phrases.noun[other.type];

  if (ratio < 1.15) {
    return pick(phrases.even, seed);
  }
  if (ratio >= 2 && Number.isFinite(ratio)) {
    return pick(phrases.dominant, seed)({
      top: cap(topNoun),
      other: otherNoun,
      ratio: ratio.toFixed(1),
    });
  }
  return pick(phrases.lean, seed)({ top: cap(topNoun), other: otherNoun });
}

/**
 * One genuinely useful nudge, keyed off the same signal as the verdict.
 */
export function adviceLine(b: DayTypeBreakdown, phrases: DayTypePhrases): string {
  const top = topByAverage(b);
  if (!top) return "";
  const other = runnerUp(b, top);
  if (!other) return phrases.adviceSingle;
  const ratio = other.average > 0 ? top.average / other.average : Infinity;
  if (ratio >= 1.5 && Number.isFinite(ratio)) {
    return phrases.adviceDominant({
      top: phrases.noun[top.type],
      ratio: ratio.toFixed(1),
    });
  }
  return phrases.adviceBalanced;
}

/**
 * A funny aside naming the category that does the most damage on days off (or
 * on workdays, if days off are quiet). Deterministic like the lines above.
 * `nameOf` resolves a category id to its display name.
 */
export function categoryQuip(
  b: DayTypeBreakdown,
  nameOf: (id: string) => string,
  phrases: DayTypePhrases
): string {
  const seed = Math.round(b.grandTotal);
  const topOff = maxByType(b, "dayoff");
  if (topOff && topOff.byType.dayoff > 0) {
    return pick(phrases.quipDayoff, seed)({ name: nameOf(topOff.categoryId) });
  }
  const topWork = maxByType(b, "workday");
  if (topWork && topWork.byType.workday > 0) {
    return phrases.quipWorkday({ name: nameOf(topWork.categoryId) });
  }
  return "";
}

/** The category with the highest spend of the given day type. */
function maxByType(b: DayTypeBreakdown, type: DayType): CategoryDayTypeStat | null {
  let best: CategoryDayTypeStat | null = null;
  for (const c of b.categories) {
    if (!best || c.byType[type] > best.byType[type]) best = c;
  }
  return best;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
