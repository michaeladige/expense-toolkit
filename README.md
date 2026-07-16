# expense-toolkit

A money management app for tracking **expenses and income** across
**day / week / month**, with **multiple categories** on each side, **multiple
currencies**, spending **charts**, monthly **budgets**, and automatic
**weekly/monthly reports**.

Built with **React + TypeScript + Vite**. All of your data lives in the browser —
expenses, income, categories, budgets, reports, and settings are stored in
`localStorage`, so nothing is sent to a server.

> **One network exception:** live foreign-exchange rates are fetched from a
> public, keyless provider — [Frankfurter](https://frankfurter.dev/) (European
> Central Bank data), with [open.er-api.com](https://www.exchangerate-api.com/docs/free)
> as an automatic fallback — to convert mixed-currency totals into your base
> currency. Rates are cached in `localStorage`, so after the first successful
> load the app keeps converting **offline**. If no provider can be reached,
> totals are shown per currency and combined totals are marked approximate (`≈`).

## Features

- **Add / edit / delete transactions** — expenses *and* income, each with an
  amount, currency, category, date, and an optional note. One form with an
  Expense/Income toggle; one list with an All/Expenses/Income filter. Each
  entry can also be **duplicated** (dated today) for quick repeat logging, and
  the form surfaces **quick-add chips** for your most frequent recent
  (category, amount) combos.
- **Recurring transactions** — define a weekly or monthly expense or income
  (rent, salary, a subscription) and it materializes as a real transaction on
  the day it's due, the next time you open the app. A rule can fall on a fixed
  day (the 15th, every Wednesday) or on the **first / last working day** of its
  week or month — the schedule payroll and direct debits actually use.
- **Holiday calendar** — pick a country (and region, where it has holidays of
  its own) in Settings and the working-day rules above skip its public
  holidays as well as weekends. Holidays are fetched once and cached, so it
  keeps working offline. Most countries come from
  [Nager.Date](https://date.nager.at); Taiwan comes from a mirror of the
  government calendar and additionally honors its make-up working Saturdays
  (補行上班). With no country selected, working days are simply Mon–Fri.
- **Day / Week / Month views** with previous/next navigation and a "Today" jump.
- **Income vs. expenses** — the summary shows income, expenses, and **net** for
  the selected period.
- **Multiple currencies** — each entry keeps its own currency; the summary shows
  per-currency subtotals **and** a single total converted to your base currency.
- **Categories** — separate, independently editable sets for expenses and income
  (name, icon, color), both extendable in Settings.
- **Automatic weekly & monthly reports** — a report is written for each week and
  month that finishes, with income, expenses, net, the change vs. the previous
  period, and a category breakdown. See [Reports and notifications](#reports-and-notifications).
- **Spending chart** — a donut breakdown of spend-by-category for the selected
  period, with an interactive legend.
- **Spending trend** — a bar chart of totals across recent periods (last 14 days /
  8 weeks / 12 months), with the current period highlighted.
- **Monthly budgets** — set overall or per-category limits and watch progress bars
  turn amber near the limit and red when exceeded.
- **Two monthly grades** — report-card letters (S/A/B/C/D/F) scored against two
  different yardsticks, each labelled with the one it uses:
  - **Spending** — vs your Overall budget if you've set one, or your average
    monthly spend otherwise.
  - **Savings** — what share of the month's income survived it (`net / income`),
    with the conventional 20% savings rate anchoring an A. Shown only when
    you've recorded income that month.

  They're deliberately separate rather than combined: you can hold your budget
  and still save nothing, or blow past it in a month you earned plenty, and one
  letter can't say both.
- **CSV import / export** — back up or move your data as a plain CSV (columns:
  `date, type, amount, currency, category, note`), and a "Clear all" reset.
  Files exported before income existed (no `type` column) still import fine, as
  all-expenses.
- **Full JSON backup / restore** — a single file capturing everything: not just
  transactions but categories (with colors/icons), budgets, reports, recurring
  rules, and settings. CSV can't round-trip most of that; the JSON backup is
  the real safety net, and restoring **replaces** current data (with a
  confirmation first).
- **Installable / offline (PWA)** — install to your home screen or desktop, and
  the app shell loads with no network at all after the first visit.

## Reports and notifications

A report is generated for every week and month that finishes, stored locally,
and browsable under **Reports**. Each one is a frozen snapshot — totals and
category names are recorded as they were at the time, so a past report doesn't
change value when exchange rates move or you rename a category. Periods in which
you recorded nothing are skipped.

**Reports are produced when you next open the app, not at the moment the period
ends.** This is a real limitation, not a temporary one:

- The app has no backend and your data never leaves the browser, so no server
  exists that *could* generate a report or send you one — it has no access to
  your data by design.
- Browsers give a web app no way to run code at a scheduled time while it's
  closed.

So if a month ends on Friday and you next open the app on Monday, the report is
written on Monday. Nothing is ever skipped — it may just arrive late. Opting in
to notifications (Settings → Reports) additionally fires a system notification
when reports are generated; an in-app message is always shown regardless, so you
still find out if notifications are off, blocked, or unsupported. On iOS,
notifications require the app to be installed to the home screen first.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and build for production into `dist/`. |
| `npm run preview` | Preview the production build locally, served under the same `/expense-toolkit/` base path GitHub Pages uses. |
| `npm run typecheck` | Run the TypeScript compiler without emitting. |
| `npm run icons` | Regenerate the PWA/favicon PNGs from `public/favicon.svg` and `scripts/icon-source-maskable.svg`. |

## Deployment (GitHub Pages)

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the app and publishes it to GitHub Pages on every push to `main`.

To enable it once:

1. In the repository, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
2. Merge to `main` (or run the workflow manually from the **Actions** tab).

The app will be served at `https://<your-username>.github.io/expense-toolkit/`.
Production builds use that repo path as their base (configured in
`vite.config.ts`); the dev server keeps serving from `/`.

## Tech notes

- State is held in a small React Context (`src/store/ExpenseContext.tsx`) backed by
  a `useLocalStorage` hook.
- Currency conversion and formatting live in `src/lib/currency.ts`; period/date
  math in `src/lib/dates.ts`; period summaries in `src/lib/summary.ts`; CSV
  import/export in `src/lib/csv.ts`; report snapshots in `src/lib/reports.ts`.
- Expenses and income share an `Entry` base type, so the aggregation helpers in
  `src/lib/summary.ts` serve both rather than being duplicated per side.
- Report catch-up runs in `src/hooks/useAutoReports.ts`; notification delivery is
  wrapped in `src/lib/notify.ts` (which routes through the service worker,
  because `new Notification()` throws on Android Chrome).
- FX rates are fetched and cached by `src/hooks/useExchangeRates.ts`.
- Styling is plain CSS with CSS Modules and light/dark theming via CSS variables.
- PWA support (manifest, service worker, offline app-shell caching) is provided
  by `vite-plugin-pwa`, configured in `vite.config.ts`. Update notifications are
  handled by `src/components/UpdatePrompt.tsx`. The service worker only
  precaches the static app shell — the FX-rate cache above is a separate,
  app-level mechanism, not duplicated by the service worker.
