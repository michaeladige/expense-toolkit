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

Client-only React + TypeScript + Vite app. All persistent state lives in `localStorage`; there is no backend. The one network dependency is optional (live FX rates) and degrades gracefully offline.

**State**: `src/store/ExpenseContext.tsx` is a single React Context (`ExpenseProvider` / `useExpenses()`) holding `expenses`, `categories`, `incomes`, `incomeCategories`, `budgets`, `reports`, and `settings`. Each slice is backed independently by `src/store/useLocalStorage.ts`, so every mutator (`addExpense`, `updateCategory`, `setBudget`, etc.) writes straight through to `localStorage`. `App.tsx` is the sole consumer of `useExpenses()` and derives all view state (period totals, chart data, trend buckets, spending grade) via `useMemo`, then passes plain props down to presentational components in `src/components/`. Components do not call `useExpenses()` themselves.

**Expenses and income are parallel but separate.** They have identical shape and share the `Entry` base type in `src/types.ts`, but live in separate storage keys with separate category lists. The payoff: the helpers in `src/lib/summary.ts` take `Entry`, so both sides aggregate through the same code — extend those rather than writing income-specific variants. `TaggedEntry` (a `kind`-discriminated union) is what the unified list/form pass around; `App.tsx` merges the two arrays into it.

Deleting a category doesn't cascade-delete its entries — it reassigns their `categoryId` to that side's catch-all (`OTHER_EXPENSE_ID` / `OTHER_INCOME_ID` in `src/lib/constants.ts`) and removes any budget tied to it, so totals stay consistent. Income category ids are `inc-` prefixed so they can't collide with expense ids in CSV rows or report snapshots.

**FX rates**: `src/hooks/useExchangeRates.ts` fetches from Frankfurter first, falling back to open.er-api.com on failure (`PROVIDERS` array, tried in order — a single provider outage doesn't take rates down). Results are cached in `localStorage` (`STORAGE_KEYS.rates`) keyed to the current base currency and refetched after 6 hours (`MAX_AGE_MS`) or on manual refresh. Cache miss/expired + fetch failure falls back to whatever's cached, surfaced via `RateStatus` (`idle | loading | live | cached | error`) rather than throwing.

**Domain math** lives in `src/lib/`, kept separate from components/state:
- `dates.ts` — period range calculation (day/week/month), navigation, recent-period bucketing for the trend chart, and `periodKey`/`weekKey` for reports. Week keys are `"W" + the week's Monday` rather than ISO week numbers, deliberately: deriving them from the same Monday-start `getRange` the app already uses avoids the ISO year-boundary rules while still sorting chronologically.
- `summary.ts` — aggregates `Entry[]` into base-currency totals (`sumByCategoryInBase`, `totalInBase`, `totalsByMonthInBase`, `netInBase`); this is where currency conversion happens.
- `currency.ts` — conversion/formatting helpers.
- `grade.ts` — `gradeSpending(actual, target)` turns a spend-vs-target ratio into a letter grade. Expense-only, as are budgets.
- `csv.ts` — import/export for the `date, type, amount, currency, category, note` format. **A file with no `type` column must keep importing as all-expenses** — that's the format exported before income existed, and users have those backups.
- `reports.ts` — `pendingReportPeriods` (which completed periods still need a report) and `buildReport` (the snapshot).
- `constants.ts` — `DEFAULT_CATEGORIES`, `DEFAULT_INCOME_CATEGORIES`, `DEFAULT_SETTINGS`, and `STORAGE_KEYS` (the localStorage key registry — add new persisted state here).

**Reports** (`src/lib/reports.ts` + `src/hooks/useAutoReports.ts`): one snapshot per completed week/month, generated on app open/focus. Several constraints are load-bearing and easy to regress:
- *Reports are frozen snapshots.* Totals **and** category names/colors are stored, not recomputed, so FX drift or a renamed/deleted category can't rewrite history. Don't "simplify" this back into live lookups.
- *Never generate while `useExchangeRates` status is `loading`/`idle`* — snapshotting against an empty rate map would permanently freeze wrong totals.
- *`settings.reportsSince` is a watermark* set on first run so existing history isn't backfilled; generation is also capped (`BACKFILL_CAP`) so a long absence can't produce a flood.
- *Report ids are derived from their period* (`month:2026-06`), which is what makes repeat generation idempotent.
- *Walk back from a period's start, not from `now`* — shifting a month back from the 31st lands on the same month and would silently skip one.
- Periods with no entries produce no report (`buildReport` returns `null`).

**Notifications** (`src/lib/notify.ts`): delivery goes through `ServiceWorkerRegistration.showNotification`, because `new Notification()` **throws on Android Chrome**; the constructor is only a desktop fallback. On iOS the API exists only once the PWA is installed to the home screen, so callers must degrade rather than assume delivery — `notify()` returns a boolean and an in-app toast (`ReportToast`) is always shown regardless. Permission is requested from an explicit button in Settings, never on load (iOS requires a user gesture).

There is no scheduled/push delivery and there cannot be one without a backend: browsers can't run a closed web app's code on a schedule, and a server couldn't build these reports anyway since the data is localStorage-only. If asked for "notify me exactly when the month ends", that's the constraint to explain — the README documents it.

The spending grade (`App.tsx`) targets the "Overall" budget if one is set; otherwise it averages total spend of prior months (relative to the viewed month, not wall-clock today) that have at least one expense.

**Styling**: plain CSS with CSS Modules per component (`*.module.css`), plus global light/dark theming via CSS variables in `src/index.css`.

**PWA**: configured in `vite.config.ts` via `vite-plugin-pwa`. The plugin's own SW registration is disabled (`injectRegister: false`) because `src/components/UpdatePrompt.tsx` registers the service worker itself via `virtual:pwa-register/react` — don't re-enable `injectRegister` without removing that manual registration, or the SW registers twice. The service worker only precaches the static app shell; the FX-rate cache is a separate, app-level `localStorage` mechanism.

**Base path**: production builds are served from `/expense-toolkit/` (GitHub Pages project path), dev serves from `/`. This is switched in `vite.config.ts` based on the Vite `command`, and threaded into the PWA manifest's `start_url`/`scope` too — keep both in sync if the deployment path ever changes.

**Deployment**: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
