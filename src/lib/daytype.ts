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

/** True when any day type recorded spending — the card's non-empty gate. */
export function hasActivity(b: DayTypeBreakdown): boolean {
  return b.grandTotal > 0;
}

const TYPE_NOUN: Record<DayType, string> = {
  weekday: "weekdays",
  weekend: "weekends",
  holiday: "holidays",
};

/** The day type with the highest per-day average, among those with activity. */
function topByAverage(b: DayTypeBreakdown): DayTypeStat | null {
  const active = DAY_TYPES.map((t) => b.stats[t]).filter((s) => s.activeDays > 0);
  if (active.length === 0) return null;
  return active.reduce((hi, s) => (s.average > hi.average ? s : hi));
}

/** The next-highest per-day average below `top`, or null if `top` is alone. */
function runnerUp(b: DayTypeBreakdown, top: DayTypeStat): DayTypeStat | null {
  const rest = DAY_TYPES.map((t) => b.stats[t]).filter(
    (s) => s.activeDays > 0 && s.type !== top.type
  );
  if (rest.length === 0) return null;
  return rest.reduce((hi, s) => (s.average > hi.average ? s : hi));
}

/**
 * Stable index into a template list from the rounded stats, so the chosen line
 * doesn't flicker between renders (the breakdown object is recomputed each
 * render, but its rounded numbers are stable).
 */
function pick(options: string[], seed: number): string {
  const i = Math.abs(Math.round(seed)) % options.length;
  return options[i];
}

const SINGLE_TYPE_VERDICTS: Record<DayType, string[]> = {
  weekday: [
    "Every dollar you log lands on a weekday. A creature of pure routine.",
    "All weekday spending. The weekend wallet is in witness protection.",
  ],
  weekend: [
    "Every expense is a weekend expense. Monday–Friday you simply cease to exist.",
    "100% weekend spending. The week is just the loading screen for Saturday.",
  ],
  holiday: [
    "You only spend on holidays. An impressively festive data set.",
    "All holiday spending — you treat the calendar's red days as a personal challenge.",
  ],
};

/**
 * A one-line, tongue-in-cheek read of the spending shape. Deterministic: no
 * randomness, no network.
 */
export function verdictLine(b: DayTypeBreakdown): string {
  const top = topByAverage(b);
  if (!top) return "";
  const seed = Math.round(b.grandTotal);
  const other = runnerUp(b, top);
  if (!other) return pick(SINGLE_TYPE_VERDICTS[top.type], seed);

  const ratio = other.average > 0 ? top.average / other.average : Infinity;
  const topNoun = TYPE_NOUN[top.type];
  const otherNoun = TYPE_NOUN[other.type];

  if (ratio < 1.15) {
    return pick(
      [
        `Your ${topNoun} and ${otherNoun} spend at nearly the same clip — refreshingly consistent, or refreshingly doomed.`,
        `${cap(topNoun)} and ${otherNoun} are neck and neck. Your wallet does not read the calendar.`,
      ],
      seed
    );
  }
  if (ratio >= 2) {
    return pick(
      [
        `On ${topNoun} your day-rate is ${ratio.toFixed(1)}× your ${otherNoun}. The other days are just savings in disguise.`,
        `${cap(topNoun)} cost you ${ratio.toFixed(1)}× what ${otherNoun} do. That's not a habit, that's a lifestyle.`,
      ],
      seed
    );
  }
  return pick(
    [
      `${cap(topNoun)} edge out ${otherNoun} as your priciest day type. Noted.`,
      `You lean toward spending on ${topNoun} more than ${otherNoun}. Predictable, in a comforting way.`,
    ],
    seed
  );
}

/**
 * One genuinely useful nudge, keyed off the same signal as the verdict.
 */
export function adviceLine(b: DayTypeBreakdown): string {
  const top = topByAverage(b);
  if (!top) return "";
  const other = runnerUp(b, top);
  if (!other) {
    return "Log a few more days and this splits into a real weekday-vs-weekend comparison.";
  }
  const ratio = other.average > 0 ? top.average / other.average : Infinity;
  const topNoun = TYPE_NOUN[top.type];
  if (ratio >= 1.5 && Number.isFinite(ratio)) {
    return `Your ${topNoun} day-rate runs ${ratio.toFixed(1)}× the rest — deciding one "fun budget" number ahead of time tends to cap those days.`;
  }
  return "Your day types are fairly balanced — a single overall monthly budget will serve you better than fussing over which day it is.";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
