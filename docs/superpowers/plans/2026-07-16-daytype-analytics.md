# Day-Type Spending Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live, all-time main-view card that breaks expenses into weekday / weekend / holiday spending with totals, per-day averages, and a deterministic funny verdict plus advice.

**Architecture:** A new pure module `src/lib/daytype.ts` classifies each expense's date via the existing `WorkCalendar` and aggregates base-currency totals into a `DayTypeBreakdown`, plus two deterministic text generators. `App.tsx` derives the breakdown in a `useMemo` (App derives, components present — the app's established pattern) and passes it to a new presentational `DayTypeAnalytics` component.

**Tech Stack:** React + TypeScript + Vite, CSS Modules, `localStorage`. No new dependencies.

## Global Constraints

- No test suite exists; `npm run typecheck` is the only automated check — run it before finishing any task. Verify behavior by driving the app.
- Client-only, offline-tolerant: no backend, no LLM, no network dependency in this feature. All text is deterministic local logic.
- Currency conversion goes through `convert` from `src/lib/currency.ts`; unconvertible amounts fall back to the raw amount (same as `src/lib/summary.ts`).
- Reuse `WorkCalendar` semantics from `src/lib/workdays.ts`; do not re-derive weekend/holiday rules.
- Mobile-first (~360–420px primary), theme-aware via existing CSS variables in `src/index.css`.
- Scratch verification scripts go under the session scratchpad, run with `npx tsx`, and are **never** committed.

---

### Task 1: `daytype.ts` — classification and aggregation

**Files:**
- Create: `src/lib/daytype.ts`
- Verify (scratch, not committed): `<scratchpad>/verify-daytype.ts`

**Interfaces:**
- Consumes: `WorkCalendar` from `src/lib/workdays.ts`; `Expense`, `RateMap` from `src/types.ts`; `convert` from `src/lib/currency.ts`; `toISODate` from `src/lib/dates.ts`.
- Produces:
  - `type DayType = "weekday" | "weekend" | "holiday"`
  - `classifyDay(date: Date, calendar: WorkCalendar): DayType`
  - `interface DayTypeStat { type: DayType; total: number; activeDays: number; average: number; share: number }`
  - `interface DayTypeBreakdown { stats: Record<DayType, DayTypeStat>; grandTotal: number; approximate: boolean; holidaysKnown: boolean }`
  - `buildDayTypeBreakdown(expenses: Expense[], calendar: WorkCalendar, knownYears: ReadonlySet<number>, base: string, rates: RateMap): DayTypeBreakdown`

- [ ] **Step 1: Write the module**

Create `src/lib/daytype.ts`:

```ts
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
```

- [ ] **Step 2: Write the scratch verification script**

Create `<scratchpad>/verify-daytype.ts` (replace `<scratchpad>` with the real session scratchpad path):

```ts
import { classifyDay, buildDayTypeBreakdown } from "../src/lib/daytype";
import type { WorkCalendar } from "../src/lib/workdays";
import type { Expense } from "../src/types";

const cal: WorkCalendar = {
  holidays: new Set(["2026-01-01"]), // Thu New Year
  workdays: new Set(["2026-02-21"]), // a make-up Saturday
};

function mk(date: string, amount: number, currency = "USD"): Expense {
  return { id: date + amount, amount, currency, categoryId: "c", date, createdAt: "" };
}

// classifyDay
console.assert(classifyDay(new Date(2026, 0, 1), cal) === "holiday", "New Year is holiday");
console.assert(classifyDay(new Date(2026, 0, 2), cal) === "weekday", "Fri is weekday");
console.assert(classifyDay(new Date(2026, 0, 3), cal) === "weekend", "Sat is weekend");
console.assert(classifyDay(new Date(2026, 1, 21), cal) === "weekday", "make-up Sat is weekday");

// holiday-on-weekend stays weekend: add a Sat holiday to the calendar
const cal2: WorkCalendar = { holidays: new Set(["2026-01-03"]), workdays: new Set() };
console.assert(classifyDay(new Date(2026, 0, 3), cal2) === "weekend", "holiday on Sat stays weekend");

const rates = { USD: 1 };
const known = new Set([2026]);

// aggregation + per-day average = total / distinct active days
const b = buildDayTypeBreakdown(
  [mk("2026-01-05", 10), mk("2026-01-05", 30), mk("2026-01-06", 20), mk("2026-01-03", 50)],
  cal,
  known,
  "USD",
  rates
);
console.assert(b.stats.weekday.total === 60, "weekday total 60");
console.assert(b.stats.weekday.activeDays === 2, "weekday active days 2 (5th, 6th)");
console.assert(b.stats.weekday.average === 30, "weekday avg 30");
console.assert(b.stats.weekend.total === 50, "weekend total 50");
console.assert(b.grandTotal === 110, "grand total 110");
console.assert(Math.abs(b.stats.weekday.share - 60 / 110) < 1e-9, "weekday share");
console.assert(b.holidaysKnown === true, "holidays known");
console.assert(b.approximate === false, "not approximate within known years");

// approximate: expense in an unfetched year with a country configured
const b2 = buildDayTypeBreakdown([mk("2024-06-03", 5)], cal, known, "USD", rates);
console.assert(b2.approximate === true, "2024 outside knownYears -> approximate");

// no country configured -> holidaysKnown false, not approximate
const b3 = buildDayTypeBreakdown([mk("2024-06-03", 5)], { holidays: new Set(), workdays: new Set() }, new Set(), "USD", rates);
console.assert(b3.holidaysKnown === false, "no country -> holidays not known");
console.assert(b3.approximate === false, "no country -> not approximate");

console.log("OK");
```

- [ ] **Step 3: Run the verification, expect failure first if module incomplete, then pass**

Run: `npx tsx <scratchpad>/verify-daytype.ts`
Expected: prints `OK` with no assertion warnings. (If any `console.assert` fails it prints an "Assertion failed" line — fix the module until only `OK` prints.)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/daytype.ts
git commit -m "Add day-type classification and spending aggregation"
```

---

### Task 2: `daytype.ts` — deterministic verdict and advice

**Files:**
- Modify: `src/lib/daytype.ts` (append)
- Verify (scratch, not committed): `<scratchpad>/verify-daytype-text.ts`

**Interfaces:**
- Consumes: `DayTypeBreakdown`, `DayType`, `DayTypeStat` from Task 1.
- Produces:
  - `verdictLine(b: DayTypeBreakdown): string`
  - `adviceLine(b: DayTypeBreakdown): string`
  - `hasActivity(b: DayTypeBreakdown): boolean`

- [ ] **Step 1: Append the text generators to `src/lib/daytype.ts`**

```ts
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
```

- [ ] **Step 2: Write the scratch verification script**

Create `<scratchpad>/verify-daytype-text.ts`:

```ts
import { buildDayTypeBreakdown, verdictLine, adviceLine, hasActivity } from "../src/lib/daytype";
import type { WorkCalendar } from "../src/lib/workdays";
import type { Expense } from "../src/types";

const cal: WorkCalendar = { holidays: new Set(), workdays: new Set() };
const rates = { USD: 1 };
const known = new Set([2026]);
const mk = (date: string, amount: number): Expense => ({ id: date + amount, amount, currency: "USD", categoryId: "c", date, createdAt: "" });

// empty -> no activity, empty strings
const empty = buildDayTypeBreakdown([], cal, known, "USD", rates);
console.assert(hasActivity(empty) === false, "empty has no activity");
console.assert(verdictLine(empty) === "", "empty verdict is blank");
console.assert(adviceLine(empty) === "", "empty advice is blank");

// weekend-heavy: 2026-01-05 Mon (10), 2026-01-10 Sat (100)
const heavy = buildDayTypeBreakdown([mk("2026-01-05", 10), mk("2026-01-10", 100)], cal, known, "USD", rates);
const v = verdictLine(heavy);
const a = adviceLine(heavy);
console.assert(v.length > 0 && a.length > 0, "heavy produces text");
console.assert(v === verdictLine(heavy), "verdict is deterministic across calls");
console.log("verdict:", v);
console.log("advice:", a);

// single type only (all weekday)
const single = buildDayTypeBreakdown([mk("2026-01-05", 10), mk("2026-01-06", 20)], cal, known, "USD", rates);
console.assert(verdictLine(single).length > 0, "single-type verdict non-empty");
console.log("single verdict:", verdictLine(single));

console.log("OK");
```

- [ ] **Step 3: Run it**

Run: `npx tsx <scratchpad>/verify-daytype-text.ts`
Expected: prints the sample lines and `OK`, no assertion-failed lines.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/daytype.ts
git commit -m "Add deterministic day-type verdict and advice lines"
```

---

### Task 3: `DayTypeAnalytics` presentational component

**Files:**
- Create: `src/components/DayTypeAnalytics.tsx`
- Create: `src/components/DayTypeAnalytics.module.css`

**Interfaces:**
- Consumes: `DayTypeBreakdown`, `DayType`, `DAY_TYPES`, `verdictLine`, `adviceLine`, `hasActivity` from `src/lib/daytype.ts`; `formatMoney` from `src/lib/currency.ts` (verify the exact export name in that file — use whatever the rest of the app uses to render base-currency amounts).
- Produces: `export function DayTypeAnalytics(props: { breakdown: DayTypeBreakdown; baseCurrency: string }): JSX.Element` — consumed by Task 4.

- [ ] **Step 1: Confirm the money-formatting helper name**

Run: `grep -n "export function" src/lib/currency.ts`
Expected: note the formatter used elsewhere (e.g. in `SummaryCards.tsx`). Run `grep -rn "from \"../lib/currency\"" src/components | head` to see which function components import, and use that same one below in place of `formatMoney`.

- [ ] **Step 2: Write the component**

Create `src/components/DayTypeAnalytics.tsx`. Replace `formatMoney` with the helper confirmed in Step 1 if different:

```tsx
import type { DayType, DayTypeBreakdown } from "../lib/daytype";
import { DAY_TYPES, adviceLine, hasActivity, verdictLine } from "../lib/daytype";
import { formatMoney } from "../lib/currency";
import styles from "./DayTypeAnalytics.module.css";

const LABEL: Record<DayType, string> = {
  weekday: "Weekdays",
  weekend: "Weekends",
  holiday: "Holidays",
};

const BAR_COLOR: Record<DayType, string> = {
  weekday: "#3b82f6",
  weekend: "#f59e0b",
  holiday: "#ec4899",
};

interface Props {
  breakdown: DayTypeBreakdown;
  baseCurrency: string;
}

export function DayTypeAnalytics({ breakdown, baseCurrency }: Props) {
  const { stats, holidaysKnown, approximate } = breakdown;

  // Holiday row only appears when a country is configured; without one it is
  // always empty and would read as a bug.
  const rows = DAY_TYPES.filter((t) => t !== "holiday" || holidaysKnown);

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2 className={styles.title}>When you spend</h2>
        <span className={styles.sub}>All-time · avg = per day you spent</span>
      </div>

      {!hasActivity(breakdown) ? (
        <p className={styles.empty}>
          Log a few expenses and you'll see how weekdays, weekends, and holidays
          compare.
        </p>
      ) : (
        <>
          <ul className={styles.rows}>
            {rows.map((type) => {
              const s = stats[type];
              return (
                <li key={type} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.name}>
                      <span
                        className={styles.swatch}
                        style={{ background: BAR_COLOR[type] }}
                      />
                      {LABEL[type]}
                      {type === "holiday" && approximate && (
                        <span className={styles.approx} title="Some expenses fall outside the years we have holiday data for">
                          ~approx
                        </span>
                      )}
                    </span>
                    <span className={styles.total}>
                      {formatMoney(s.total, baseCurrency)}
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.round(s.share * 100)}%`,
                        background: BAR_COLOR[type],
                      }}
                    />
                  </div>
                  <div className={styles.meta}>
                    <span>{formatMoney(s.average, baseCurrency)}/day</span>
                    <span>
                      {s.activeDays} day{s.activeDays === 1 ? "" : "s"} ·{" "}
                      {Math.round(s.share * 100)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {!holidaysKnown && (
            <p className={styles.hint}>
              Set a holiday country in Settings to split out holiday spending.
            </p>
          )}

          <p className={styles.verdict}>{verdictLine(breakdown)}</p>
          <p className={styles.advice}>💡 {adviceLine(breakdown)}</p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write the styles**

Create `src/components/DayTypeAnalytics.module.css`:

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: 1rem;
}

.sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rowHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.name {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.swatch {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 3px;
  flex: none;
}

.approx {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
}

.total {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.barTrack {
  margin: 0.35rem 0 0.25rem;
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2, rgba(127, 127, 127, 0.18));
  overflow: hidden;
}

.barFill {
  height: 100%;
  border-radius: 999px;
  min-width: 2px;
  transition: width 0.2s ease;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.verdict {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  line-height: 1.35;
}

.advice {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.35;
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. (If `--surface-2` or `--text-muted` are not defined in `src/index.css`, the CSS still falls back gracefully; confirm variable names against `src/index.css` and adjust to the real names — check with `grep -n "text-muted\|--surface" src/index.css`.)

- [ ] **Step 5: Commit**

```bash
git add src/components/DayTypeAnalytics.tsx src/components/DayTypeAnalytics.module.css
git commit -m "Add DayTypeAnalytics presentational component"
```

---

### Task 4: Wire into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `buildDayTypeBreakdown` from `src/lib/daytype.ts`; `DayTypeAnalytics` from `src/components/DayTypeAnalytics.tsx`; existing `store.expenses`, `holidays.calendar`, `holidays.knownYears`, `settings.baseCurrency`, `rates`.

- [ ] **Step 1: Add imports**

In `src/App.tsx`, alongside the other component imports (near line 26–31):

```tsx
import { DayTypeAnalytics } from "./components/DayTypeAnalytics";
```

And alongside the lib imports (near line 17–19):

```tsx
import { buildDayTypeBreakdown } from "./lib/daytype";
```

- [ ] **Step 2: Derive the breakdown**

In `App.tsx`, after the `trendBuckets` memo (around line 200), add:

```tsx
  // All-time weekday / weekend / holiday spending split. Live, not a frozen
  // snapshot like reports — the whole point is the cross-cutting pattern.
  const dayTypeBreakdown = useMemo(
    () =>
      buildDayTypeBreakdown(
        store.expenses,
        holidays.calendar,
        holidays.knownYears,
        settings.baseCurrency,
        rates
      ),
    [store.expenses, holidays.calendar, holidays.knownYears, settings.baseCurrency, rates]
  );
```

- [ ] **Step 3: Render the card**

In the right-hand column (`<div className={styles.col}>` containing `TrendChart`/`CategoryChart`), add after `<CategoryChart ... />` (around line 318):

```tsx
            <DayTypeAnalytics
              breakdown={dayTypeBreakdown}
              baseCurrency={settings.baseCurrency}
            />
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Drive the app to verify**

Run: `npm run dev`, open the app, and:
1. Add expenses on a weekday, a Saturday, and (with a holiday country set in Settings, e.g. Germany) on a public holiday like `2026-01-01`. Confirm each lands in the right row and the verdict/advice render.
2. Confirm the per-day average = total ÷ distinct active days for a type where you logged two expenses on one day.
3. Remove the holiday country in Settings → the holiday row disappears and the hint appears.
4. Add an expense dated in a year with no fetched holiday data (e.g. `2023-06-01`) with a country set → holiday row shows `~approx`.
5. Clear all expenses → empty-state message shows.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "Render day-type analytics card in main view"
```

---

## Self-Review notes

- **Spec coverage:** classification (Task 1), year-bounded holiday knowledge + approximate flag (Task 1), no-country degradation (Tasks 1/3), both total and per-day average + share (Tasks 1/3), funny verdict + advice deterministic offline (Task 2), main-view card following App-derives pattern (Tasks 3/4), empty state (Tasks 2/3), live-not-frozen relation to reports (Task 4 comment). All covered.
- **Type consistency:** `DayType`, `DayTypeStat`, `DayTypeBreakdown`, `buildDayTypeBreakdown`, `verdictLine`, `adviceLine`, `hasActivity`, `DAY_TYPES` used identically across tasks.
- **Known verify-time adjustments called out inline:** exact `currency.ts` formatter name (Task 3 Step 1) and exact CSS variable names in `index.css` (Task 3 Step 4) must be confirmed against the codebase, since they are existing conventions this plan reuses rather than defines.
```
