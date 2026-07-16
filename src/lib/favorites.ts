import type { EntryKind, Expense, Income } from "../types";
import { fromISODate, todayISO } from "./dates";

const LOOKBACK_DAYS = 90;
const MIN_COUNT = 2;

export interface Favorite {
  kind: EntryKind;
  categoryId: string;
  amount: number;
  currency: string;
  count: number;
}

function withinLookback(dateISO: string, todayMs: number): boolean {
  const days = (todayMs - fromISODate(dateISO).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= LOOKBACK_DAYS;
}

/**
 * Ranks the most frequently repeated (kind, category, amount, currency)
 * combos from the last 90 days — a cheap stand-in for "favorites" that needs
 * no management UI, since it's entirely derived from existing entries.
 * Combos seen only once are excluded so one-off transactions never surface.
 */
export function topFavorites(
  expenses: Expense[],
  incomes: Income[],
  limit = 6
): Favorite[] {
  const todayMs = fromISODate(todayISO()).getTime();
  const counts = new Map<string, Favorite>();

  const tally = (kind: EntryKind, list: (Expense | Income)[]) => {
    for (const e of list) {
      if (!withinLookback(e.date, todayMs)) continue;
      const key = `${kind}:${e.categoryId}:${e.amount}:${e.currency}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          kind,
          categoryId: e.categoryId,
          amount: e.amount,
          currency: e.currency,
          count: 1,
        });
      }
    }
  };
  tally("expense", expenses);
  tally("income", incomes);

  return [...counts.values()]
    .filter((f) => f.count >= MIN_COUNT)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
