import type { TaggedEntry } from "../types";
import { fromISODate } from "./dates";

/** The kind segmented control shared by the list and the details drawer. */
export type Filter = "all" | "expense" | "income";

export const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expenses" },
  { id: "income", label: "Income" },
];

/** Newest first: by date, then by creation time within the same day. */
export function byRecency(a: TaggedEntry, b: TaggedEntry): number {
  return a.date === b.date
    ? b.createdAt.localeCompare(a.createdAt)
    : b.date.localeCompare(a.date);
}

/**
 * Free-text match for the details drawer. Matches (case-insensitive) against the
 * note, the resolved category name, and the date in both raw "YYYY-MM-DD" and
 * localized short form, so "jul", "15" and "2026-07" all hit. Empty query = all.
 */
export function matchesQuery(
  entry: TaggedEntry,
  categoryName: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const localized = fromISODate(entry.date)
    .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    .toLowerCase();
  const haystack = [
    entry.note ?? "",
    categoryName,
    entry.date,
    localized,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
