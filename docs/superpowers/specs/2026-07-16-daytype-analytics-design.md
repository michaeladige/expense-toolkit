# Day-Type Spending Analytics — Design

**Date:** 2026-07-16
**Status:** Approved for planning

## Goal

Give the user a local, offline read on *when* they spend by splitting all-time
expenses into three day types — **weekdays, weekends, and holidays** — with a
light, funny verdict and one piece of genuinely useful advice. No backend, no
LLM: everything is deterministic local computation over `localStorage` data.

## Scope decisions (settled during brainstorming)

- **Time window:** all-time (every recorded expense).
- **Placement:** a new card in the main view's right column, alongside
  `CategoryChart` / `TrendChart`. No new navigation, no new top-bar button.
- **Metric:** show **both** total spend and per-day average per type.
- **Per-day average denominator:** number of *distinct calendar days of that
  type on which the user actually recorded at least one expense* — not every
  weekday in history. Answers "when I spend on a weekend, how much?" rather than
  being diluted by zero-spend days. The card label states this so it is not
  ambiguous.
- **Holiday-on-weekend:** classified as **weekend** (it was already a day off —
  honest labeling).

## Non-goals (YAGNI)

- No new persisted state, settings, or storage keys.
- No charting library — plain numbers plus small CSS bars.
- Not a frozen snapshot and not part of the Reports feature (see below).
- No income breakdown — expenses only (the feature is about spending habits).

## Classification

Lives in a new pure module `src/lib/daytype.ts`. Reuses existing `WorkCalendar`
semantics (`src/lib/workdays.ts`) so it stays consistent with the working-day /
recurring logic:

```
date ∈ workdays (Taiwan 補行上班 make-up Saturday) → weekday
else Sat/Sun                                        → weekend
else date ∈ holidays                                → holiday
else                                                → weekday
```

`DayType = "weekday" | "weekend" | "holiday"`. A single classifier function
`classifyDay(date: Date, calendar: WorkCalendar): DayType`.

### Holiday knowledge is year-bounded

Holidays are only known for the calendar's fetched years (`holidays.knownYears`).
An entry dated in a year outside that window cannot be classified as a holiday
and falls back to weekday/weekend. When any in-range expense falls in an
unfetched year, the breakdown is flagged `approximate: true` and the card shows
an "approximate" note on the holiday row — mirroring how recurring rules flag
approximate working-day anchors.

### No holiday country configured

Weekdays/weekends are always computable with zero configuration (calendar is
`EMPTY_CALENDAR`). When `settings.holidayCountry` is absent:

- Classification yields only weekday/weekend (holiday bucket is always empty).
- The card collapses the holiday row and shows a subtle hint:
  "Set a holiday country in Settings to split out holidays."

## Aggregation

In `src/lib/daytype.ts`:

```ts
interface DayTypeStat {
  type: DayType;
  total: number;      // base-currency total for this day type
  activeDays: number; // distinct dates of this type with ≥1 expense
  average: number;    // total / activeDays, or 0 when activeDays === 0
  share: number;      // total / grandTotal, or 0 when grandTotal === 0
}

interface DayTypeBreakdown {
  stats: Record<DayType, DayTypeStat>;
  grandTotal: number;
  approximate: boolean;   // any in-range expense in a year outside knownYears
  holidaysKnown: boolean; // a holiday country is configured
}

function buildDayTypeBreakdown(
  expenses: Expense[],
  calendar: WorkCalendar,
  knownYears: ReadonlySet<number>, // matches useHolidays' return shape
  base: string,
  rates: RateMap,
): DayTypeBreakdown
```

- Per-entry base amount via `convert` (unconvertible → best-effort raw amount,
  same fallback as `summary.ts`).
- `activeDays` tracked with a `Set<string>` of ISO dates per type.
- `approximate` = true if any expense's year is not in `knownYears` **and** a
  holiday country is configured (when none is configured, holiday absence is
  expected, not approximate).

## The funny verdict + advice

Two pure, deterministic functions in `src/lib/daytype.ts`:

```ts
function verdictLine(b: DayTypeBreakdown): string
function adviceLine(b: DayTypeBreakdown): string
```

- Branch on which day type has the highest per-day `average` and how lopsided
  the ratio is (e.g. top average ÷ next-highest average). Thresholds pick a
  branch; a small template list per branch keeps it from feeling canned.
- Tone: light, self-deprecating, non-preachy. Advice is an actual nudge tied to
  the pattern (e.g. "Your weekend day-rate is 2.3× a weekday's — deciding one
  'fun budget' number on Friday tends to cap the damage.").
- Deterministic selection (e.g. index by a stable hash of the rounded stats) so
  the line is stable across renders rather than flickering on every re-render.
- Degenerate cases handled: no expenses at all → empty-state placeholder (card
  shows a friendly prompt, no verdict); only one day type has activity → a
  branch that doesn't claim a false comparison.

## Data flow & components

Follows the established pattern: `App.tsx` derives, components present.

- `App.tsx`: a new `useMemo` computing `buildDayTypeBreakdown(...)` from
  `store.expenses`, `holidays.calendar`, `holidays.knownYears`,
  `settings.baseCurrency`, `rates`. Deps mirror the other memos.
- New `src/components/DayTypeAnalytics.tsx` + `DayTypeAnalytics.module.css`:
  presentational only. Props: the breakdown, `baseCurrency`. Renders three rows
  (or two + hint) with total, per-day average, a small share bar, plus the
  verdict and advice lines. Mobile-first (~360–420px), theme-aware via existing
  CSS variables.
- Rendered in the right-hand `styles.col` in `App.tsx`, near `CategoryChart`.

## Relation to Reports (deliberate difference)

Reports (`src/lib/reports.ts`) are **frozen per-period snapshots** so history
can't shift as FX rates drift. This analytics card is **live and all-time**:
freezing per period would destroy the cross-cutting weekday/weekend/holiday
pattern it exists to show. It answers a different question ("*when* do I
spend?") than a report ("*what happened* in this completed week/month"). Kept
separate rather than bolted onto the snapshot; no change to `reports.ts`.

## Testing / verification

No test suite exists; `npm run typecheck` is the only automated check. Verify by
driving the app:

1. Seed expenses across weekdays, weekends, and a known public holiday (with a
   holiday country configured, e.g. a `DE` holiday date).
2. Confirm each lands in the right bucket; confirm a holiday-on-weekend date
   counts as weekend; confirm a Taiwan make-up Saturday counts as weekday.
3. Clear the holiday country → holiday row collapses, hint shows.
4. Seed an expense in a year outside the fetched window → holiday row flags
   approximate.
5. Empty state (no expenses) → placeholder, no verdict.
6. Run `npm run typecheck`.

## Files touched

- **New:** `src/lib/daytype.ts`, `src/components/DayTypeAnalytics.tsx`,
  `src/components/DayTypeAnalytics.module.css`
- **Edited:** `src/App.tsx` (one memo + render the card)
