# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build       # tsc -b (type-check) then vite build -> dist/
npm run typecheck   # tsc -b --noEmit, no bundling
npm run preview      # preview production build, served under /expense-toolkit/ (matches GitHub Pages)
npm run icons        # regenerate PWA/favicon PNGs from public/favicon.svg + scripts/icon-source-maskable.svg
```

There is no test suite and no lint script configured — `npm run typecheck` is the only automated check. Run it before finishing any change, and verify behavior by driving the app rather than relying on it alone.

Report generation is time-dependent, so don't wait for a real week to roll over: seed entries dated last week/month, set `expense-toolkit:settings`'s `reportsSince` to an older date in DevTools, and reload.

There is exactly one workspace/package (no monorepo tooling); all commands run from the repo root.

## Architecture

Client-only React + TypeScript + Vite app. All persistent state lives in `localStorage`; there is no backend. The two network dependencies are optional (live FX rates, public holidays) and degrade gracefully offline.

**State**: `src/store/ExpenseContext.tsx` is a single React Context (`ExpenseProvider` / `useExpenses()`) holding `expenses`, `categories`, `incomes`, `incomeCategories`, `budgets`, `reports`, and `settings`. Each slice is backed independently by `src/store/useLocalStorage.ts`, so every mutator (`addExpense`, `updateCategory`, `setBudget`, etc.) writes straight through to `localStorage`. `App.tsx` is the sole consumer of `useExpenses()` and derives all view state (period totals, chart data, trend buckets, spending grade) via `useMemo`, then passes plain props down to presentational components in `src/components/`. Components do not call `useExpenses()` themselves.

**Expenses and income are parallel but separate.** They have identical shape and share the `Entry` base type in `src/types.ts`, but live in separate storage keys with separate category lists. The payoff: the helpers in `src/lib/summary.ts` take `Entry`, so both sides aggregate through the same code — extend those rather than writing income-specific variants. `TaggedEntry` (a `kind`-discriminated union) is what the unified list/form pass around; `App.tsx` merges the two arrays into it.

Deleting a category doesn't cascade-delete its entries — it reassigns their `categoryId` to that side's catch-all (`OTHER_EXPENSE_ID` / `OTHER_INCOME_ID` in `src/lib/constants.ts`) and removes any budget tied to it, so totals stay consistent. Income category ids are `inc-` prefixed so they can't collide with expense ids in CSV rows or report snapshots.

**FX rates**: `src/hooks/useExchangeRates.ts` fetches from Frankfurter first, falling back to open.er-api.com on failure (`PROVIDERS` array, tried in order — a single provider outage doesn't take rates down). Results are cached in `localStorage` (`STORAGE_KEYS.rates`) keyed to the current base currency and refetched after 6 hours (`MAX_AGE_MS`) or on manual refresh. Cache miss/expired + fetch failure falls back to whatever's cached, surfaced via `RateStatus` (`idle | loading | live | cached | error`) rather than throwing.

**Domain math** lives in `src/lib/`, kept separate from components/state:
- `dates.ts` — period range calculation (day/week/month), navigation, recent-period bucketing for the trend chart, and `periodKey`/`weekKey` for reports. Week keys are `"W" + the week's Monday` rather than ISO week numbers, deliberately: deriving them from the same Monday-start `getRange` the app already uses avoids the ISO year-boundary rules while still sorting chronologically.
- `summary.ts` — aggregates `Entry[]` into base-currency totals (`sumByCategoryInBase`, `totalInBase`, `totalsByMonthInBase`, `netInBase`); this is where currency conversion happens.
- `currency.ts` — conversion/formatting helpers.
- `grade.ts` — two independent graders, both returning `GradeResult | null`. `gradeSpending(spent, target)` is expense-only (as are budgets) and lower-is-better; `gradeSavings(net, income)` grades `net / income` and higher-is-better, so it has its own descending `SAVINGS_TIERS` keyed on `min`. **Keep them separate** — they answer different questions ("did I stick to my plan?" vs "am I keeping any of what I earn?") and a month can pass one while failing the other, so collapsing them into one target chain would destroy information. `MonthGrades` renders both and always labels which yardstick each uses. `gradeSavings` returns null rather than F when income is 0: the app tracked expenses only until income existed, and those users must not see an unfixable F.
- `csv.ts` — import/export for the `date, type, amount, currency, category, note` format. **A file with no `type` column must keep importing as all-expenses** — that's the format exported before income existed, and users have those backups.
- `reports.ts` — `pendingReportPeriods` (which completed periods still need a report) and `buildReport` (the snapshot).
- `workdays.ts` — `isWorkingDay(d, WorkCalendar)` plus `firstWorkingDay`/`lastWorkingDay`, which return `null` for a period with no working day at all (reachable for a week, not a month). A `WorkCalendar` is two sets: `holidays` (weekdays off) and `workdays` (weekend days that are worked anyway — Taiwan's 補行上班 make-up Saturdays). The base week is fixed to Mon-Fri rather than derived from the country, but a make-up `workdays` date overrides the weekend, because that's a deliberate government designation, not an inference.
- `recurring.ts` — `dueDates` (occurrences to materialize) and `nextDue` (the UI's "next"), both driven by `resolveSchedule`.
- `constants.ts` — `DEFAULT_CATEGORIES`, `DEFAULT_INCOME_CATEGORIES`, `DEFAULT_SETTINGS`, and `STORAGE_KEYS` (the localStorage key registry — add new persisted state here).

**Reports** (`src/lib/reports.ts` + `src/hooks/useAutoReports.ts`): one snapshot per completed week/month, generated on app open/focus. Several constraints are load-bearing and easy to regress:
- *Reports are frozen snapshots.* Totals **and** category names/colors are stored, not recomputed, so FX drift or a renamed/deleted category can't rewrite history. Don't "simplify" this back into live lookups.
- *Never generate while `useExchangeRates` status is `loading`/`idle`* — snapshotting against an empty rate map would permanently freeze wrong totals.
- *`settings.reportsSince` is a watermark* set on first run so existing history isn't backfilled; generation is also capped (`BACKFILL_CAP`) so a long absence can't produce a flood.
- *Report ids are derived from their period* (`month:2026-06`), which is what makes repeat generation idempotent.
- *Walk back from a period's start, not from `now`* — shifting a month back from the 31st lands on the same month and would silently skip one.
- Periods with no entries produce no report (`buildReport` returns `null`).

**Recurring rules** (`src/lib/recurring.ts` + `src/hooks/useRecurring.ts`): materialized on app open/focus, same trigger and same reasoning as reports. A rule is a `frequency` (`week`/`month`, spelled to match `PeriodType` so `getRange`/`shiftPeriod` take it directly) plus an `anchor` (`day-of-month`, `day-of-week`, `first-working-day`, `last-working-day`). Load-bearing:
- *Every optional field defaults through `resolveSchedule`, never read directly.* `frequency`/`anchor`/`dayOfWeek` are absent on rules stored before they existed, and `useLocalStorage` doesn't merge defaults — absent means month/day-of-month. `resolveSchedule` also reconciles the two crossed frequency+anchor pairings rather than dropping the rule. `dueDates`, `nextDue` and the panel's `describeSchedule` all route through it, which is the only thing keeping the advertised date equal to the fired date.
- *The `lastApplied` watermark is a **period**, not a date.* Working-day occurrences are computed from holiday data, so an applied period's date can move between passes (cache cleared, country switched, a fetch that failed); a date comparison would then fire the same period twice. `dueDates` resumes at the period *after* the one `lastApplied` falls in and never re-evaluates it. Consequence, by design: editing a rule takes effect next period.
- *Keep the cursor pinned to period starts* — same trap reports documents, in the other direction: shifting a month forward from the 31st skips one.
- *Bound the walk by the period, not the occurrence* — an occurrence can be `null`, and testing it would stop a rule forever on a holiday-only week.
- Backfill caps are per frequency (`BACKFILL_CAPS`, 12 months / 26 weeks); they cap the flood, not completeness.

**Holidays** (`src/hooks/useHolidays.ts`): resolves the working-day anchors above. Modeled on `useExchangeRates` (provider array, localStorage cache, status union) with three deliberate differences: `HolidayStatus` adds `off` for "no country configured", without which the gate below would wait forever on a fetch that never starts; there's **no age-based expiry** (published holidays don't drift like FX — validity is "does the cache cover this country and these years", additionally shape-checked via `isYearCalendar` so a cache from an older build is refetched rather than silently read as empty); and the returned `calendar` is **memoized**, because it feeds `useRecurring`'s effect deps and a fresh object per render would re-run a state-writing check every render. `knownYears` exists so callers can tell "no holidays" from "not loaded"; a rule dormant past the fetched window resolves against weekends and the UI marks it approximate.

Unlike `useExchangeRates`, providers are **routed by country, not raced**, because no two cover the same place. `PROVIDERS[].supports(country)` picks one. Nager.Date covers everything except Taiwan, and returns `Observance` entries that are *not* days off — only `types` containing `"Public"` counts. Taiwan has no keyless multi-country source (Nager 204s it; data.gov.tw is CORS-locked to its own origin), so it has a dedicated provider: a community mirror of the government calendar (`ruyut/TaiwanCalendar` via jsDelivr), which is a day-by-day `isHoliday` calendar rather than a holiday list, and is where make-up `workdays` come from. If that provider ever dies, Taiwan just falls back to weekends-only like any failed fetch. The country picker is Nager's list plus Taiwan appended.

*Working-day rules wait for the holiday fetch to settle before firing* — the same rule as never snapshotting a report against an empty rate map. A cold start always beats the network, and entries are frozen once written, so firing on mount would permanently date them as if no holiday existed. Once it settles (live, cached, failed, or `off`) they proceed with whatever is known, falling back to weekends only. Fixed-day rules never wait.

**Notifications** (`src/lib/notify.ts`): delivery goes through `ServiceWorkerRegistration.showNotification`, because `new Notification()` **throws on Android Chrome**; the constructor is only a desktop fallback. On iOS the API exists only once the PWA is installed to the home screen, so callers must degrade rather than assume delivery — `notify()` returns a boolean and an in-app toast (`ReportToast`) is always shown regardless. Permission is requested from an explicit button in Settings, never on load (iOS requires a user gesture).

There is no scheduled/push delivery and there cannot be one without a backend: browsers can't run a closed web app's code on a schedule, and a server couldn't build these reports anyway since the data is localStorage-only. If asked for "notify me exactly when the month ends", that's the constraint to explain — the README documents it.

The spending grade (`App.tsx`) targets the "Overall" budget if one is set; otherwise it averages total spend of prior months (relative to the viewed month, not wall-clock today) that have at least one expense.

**Styling**: plain CSS with CSS Modules per component (`*.module.css`), plus global light/dark theming via CSS variables in `src/index.css`.

**PWA**: configured in `vite.config.ts` via `vite-plugin-pwa`. The plugin's own SW registration is disabled (`injectRegister: false`) because `src/components/UpdatePrompt.tsx` registers the service worker itself via `virtual:pwa-register/react` — don't re-enable `injectRegister` without removing that manual registration, or the SW registers twice. The service worker only precaches the static app shell; the FX-rate cache is a separate, app-level `localStorage` mechanism.

**Base path**: production builds are served from `/expense-toolkit/` (GitHub Pages project path), dev serves from `/`. This is switched in `vite.config.ts` based on the Vite `command`, and threaded into the PWA manifest's `start_url`/`scope` too — keep both in sync if the deployment path ever changes.

**Deployment**: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
