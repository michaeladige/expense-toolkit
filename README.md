# expense-toolkit

A money management app for tracking expenses across **day / week / month**, with
**multiple categories**, **multiple currencies**, spending **charts**, and monthly
**budgets**.

Built with **React + TypeScript + Vite**. All of your data lives in the browser —
expenses, categories, budgets, and settings are stored in `localStorage`, so
nothing is sent to a server.

> **One network exception:** live foreign-exchange rates are fetched from the
> public, keyless [Frankfurter API](https://www.frankfurter.app/) (European
> Central Bank data) to convert mixed-currency totals into your base currency.
> Rates are cached in `localStorage`, so after the first successful load the app
> keeps converting **offline**. If rates can't be reached at all, totals are
> shown per currency and combined totals are marked approximate (`≈`).

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
- **Monthly budgets** — set overall or per-category limits and watch progress bars
  turn amber near the limit and red when exceeded.

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
| `npm run preview` | Preview the production build locally. |
| `npm run typecheck` | Run the TypeScript compiler without emitting. |

## Tech notes

- State is held in a small React Context (`src/store/ExpenseContext.tsx`) backed by
  a `useLocalStorage` hook.
- Currency conversion and formatting live in `src/lib/currency.ts`; period/date
  math in `src/lib/dates.ts`; period summaries in `src/lib/summary.ts`.
- FX rates are fetched and cached by `src/hooks/useExchangeRates.ts`.
- Styling is plain CSS with CSS Modules and light/dark theming via CSS variables.
