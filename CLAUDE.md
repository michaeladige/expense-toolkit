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

There is no test suite and no lint script configured — `npm run typecheck` is the only automated check. Run it before finishing any change.

There is exactly one workspace/package (no monorepo tooling); all commands run from the repo root.

## Architecture

Client-only React + TypeScript + Vite app. All persistent state lives in `localStorage`; there is no backend. The one network dependency is optional (live FX rates) and degrades gracefully offline.

**State**: `src/store/ExpenseContext.tsx` is a single React Context (`ExpenseProvider` / `useExpenses()`) holding `expenses`, `categories`, `budgets`, and `settings`. Each slice is backed independently by `src/store/useLocalStorage.ts`, so every mutator (`addExpense`, `updateCategory`, `setBudget`, etc.) writes straight through to `localStorage`. `App.tsx` is the sole consumer of `useExpenses()` and derives all view state (period totals, chart data, trend buckets, spending grade) via `useMemo`, then passes plain props down to presentational components in `src/components/`. Components do not call `useExpenses()` themselves.

Deleting a category doesn't cascade-delete its expenses — `deleteCategory` reassigns their `categoryId` to `"other"` and removes any budget tied to that category, so totals stay consistent.

**FX rates**: `src/hooks/useExchangeRates.ts` fetches from Frankfurter first, falling back to open.er-api.com on failure (`PROVIDERS` array, tried in order — a single provider outage doesn't take rates down). Results are cached in `localStorage` (`STORAGE_KEYS.rates`) keyed to the current base currency and refetched after 6 hours (`MAX_AGE_MS`) or on manual refresh. Cache miss/expired + fetch failure falls back to whatever's cached, surfaced via `RateStatus` (`idle | loading | live | cached | error`) rather than throwing.

**Domain math** lives in `src/lib/`, kept separate from components/state:
- `dates.ts` — period range calculation (day/week/month), navigation, recent-period bucketing for the trend chart.
- `summary.ts` — aggregates expenses into base-currency totals (`sumByCategoryInBase`, `totalInBase`, `totalsByMonthInBase`); this is where per-expense currency conversion happens.
- `currency.ts` — conversion/formatting helpers.
- `grade.ts` — `gradeSpending(actual, target)` turns a spend-vs-target ratio into a letter grade.
- `csv.ts` — import/export for the `date, amount, currency, category, note` CSV format.
- `constants.ts` — `DEFAULT_CATEGORIES`, `DEFAULT_SETTINGS`, and `STORAGE_KEYS` (the localStorage key registry — add new persisted state here).

The spending grade (`App.tsx`) targets the "Overall" budget if one is set; otherwise it averages total spend of prior months (relative to the viewed month, not wall-clock today) that have at least one expense.

**Styling**: plain CSS with CSS Modules per component (`*.module.css`), plus global light/dark theming via CSS variables in `src/index.css`.

**PWA**: configured in `vite.config.ts` via `vite-plugin-pwa`. The plugin's own SW registration is disabled (`injectRegister: false`) because `src/components/UpdatePrompt.tsx` registers the service worker itself via `virtual:pwa-register/react` — don't re-enable `injectRegister` without removing that manual registration, or the SW registers twice. The service worker only precaches the static app shell; the FX-rate cache is a separate, app-level `localStorage` mechanism.

**Base path**: production builds are served from `/expense-toolkit/` (GitHub Pages project path), dev serves from `/`. This is switched in `vite.config.ts` based on the Vite `command`, and threaded into the PWA manifest's `start_url`/`scope` too — keep both in sync if the deployment path ever changes.

**Deployment**: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`.
