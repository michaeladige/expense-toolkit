# expense-toolkit

A money management app for tracking expenses across **day / week / month**, with
**multiple categories**, **multiple currencies**, spending **charts**, and monthly
**budgets**.

Built with **React + TypeScript + Vite**. All of your data lives in the browser —
expenses, categories, budgets, and settings are stored in `localStorage`, so
nothing is sent to a server.

> **One network exception:** live foreign-exchange rates are fetched from a
> public, keyless provider — [Frankfurter](https://frankfurter.dev/) (European
> Central Bank data), with [open.er-api.com](https://www.exchangerate-api.com/docs/free)
> as an automatic fallback — to convert mixed-currency totals into your base
> currency. Rates are cached in `localStorage`, so after the first successful
> load the app keeps converting **offline**. If no provider can be reached,
> totals are shown per currency and combined totals are marked approximate (`≈`).

## Features

- **Add / edit / delete expenses** — amount, currency, category, date, and an
  optional note.
- **Day / Week / Month views** with previous/next navigation and a "Today" jump.
- **Multiple currencies** — each expense keeps its own currency; the summary shows
  per-currency subtotals **and** a single total converted to your base currency.
- **Categories** — seven color-coded defaults, fully editable (name, icon, color)
  and extendable in Settings.
- **Spending chart** — a donut breakdown of spend-by-category for the selected
  period, with an interactive legend.
- **Spending trend** — a bar chart of totals across recent periods (last 14 days /
  8 weeks / 12 months), with the current period highlighted.
- **Monthly budgets** — set overall or per-category limits and watch progress bars
  turn amber near the limit and red when exceeded.
- **Spending grade** — a report-card letter grade (S/A/B/C/D/F) for the month,
  scored against your Overall budget if you've set one, or your average
  monthly spend otherwise.
- **CSV import / export** — back up or move your data as a plain CSV (columns:
  `date, amount, currency, category, note`), and a "Clear all" reset.
- **Installable / offline (PWA)** — install to your home screen or desktop, and
  the app shell loads with no network at all after the first visit.

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
  import/export in `src/lib/csv.ts`.
- FX rates are fetched and cached by `src/hooks/useExchangeRates.ts`.
- Styling is plain CSS with CSS Modules and light/dark theming via CSS variables.
- PWA support (manifest, service worker, offline app-shell caching) is provided
  by `vite-plugin-pwa`, configured in `vite.config.ts`. Update notifications are
  handled by `src/components/UpdatePrompt.tsx`. The service worker only
  precaches the static app shell — the FX-rate cache above is a separate,
  app-level mechanism, not duplicated by the service worker.
