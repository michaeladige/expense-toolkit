import { useMemo, useState } from "react";
import type { Category, RateMap, TaggedEntry } from "../types";
import { EntryItem } from "./EntryItem";
import { FILTERS, byRecency, matchesQuery, type Filter } from "../lib/entryFilters";
import styles from "./AllEntriesPanel.module.css";

interface Props {
  entries: TaggedEntry[];
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  categories: Category[];
  incomeCategories: Category[];
  baseCurrency: string;
  rates: RateMap;
  periodLabel: string;
  onEdit: (e: TaggedEntry) => void;
  onDelete: (e: TaggedEntry) => void;
  onDuplicate: (e: TaggedEntry) => void;
  onClose: () => void;
}

export function AllEntriesPanel({
  entries,
  categoryById,
  incomeCategoryById,
  categories,
  incomeCategories,
  baseCurrency,
  rates,
  periodLabel,
  onEdit,
  onDelete,
  onDuplicate,
  onClose,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const resolve = (e: TaggedEntry) =>
    e.kind === "income"
      ? incomeCategoryById(e.categoryId)
      : categoryById(e.categoryId);

  // Category options depend on the kind filter, so the dropdown never offers a
  // category that can't appear under the current kind (e.g. income categories
  // while viewing Expenses).
  const categoryOptions = useMemo(() => {
    const lists: Category[] = [];
    if (filter !== "income") lists.push(...categories);
    if (filter !== "expense") lists.push(...incomeCategories);
    return lists;
  }, [filter, categories, incomeCategories]);

  // Bound the pickers to the span the period actually contains, so a chosen
  // date can never land outside the available entries.
  const dateBounds = useMemo(() => {
    if (entries.length === 0) return null;
    const dates = entries.map((e) => e.date);
    return { min: dates.reduce((a, b) => (a < b ? a : b)), max: dates.reduce((a, b) => (a > b ? a : b)) };
  }, [entries]);

  const visible = entries
    .filter((e) => filter === "all" || e.kind === filter)
    .filter((e) => categoryId === "all" || e.categoryId === categoryId)
    .filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
    .filter((e) => matchesQuery(e, resolve(e)?.name ?? "", query));
  const sorted = [...visible].sort(byRecency);

  // Reset a category selection that the new kind filter no longer offers.
  const onFilterChange = (f: Filter) => {
    setFilter(f);
    if (categoryId !== "all") setCategoryId("all");
  };

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label="All transactions"
        aria-modal="true"
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.heading}>All transactions</h2>
            <span className={styles.subheading}>{periodLabel}</span>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Close all transactions"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className={styles.controls}>
          <div
            className={styles.filters}
            role="group"
            aria-label="Filter by type"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ""}`}
                aria-pressed={filter === f.id}
                onClick={() => onFilterChange(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            className="input"
            type="search"
            placeholder="Search note, category or date…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search transactions"
          />

          <select
            className="select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>

          <div className={styles.dateRow}>
            <label className={styles.dateField}>
              <span>From</span>
              <input
                className="input"
                type="date"
                value={from}
                min={dateBounds?.min}
                max={to || dateBounds?.max}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className={styles.dateField}>
              <span>To</span>
              <input
                className="input"
                type="date"
                value={to}
                min={from || dateBounds?.min}
                max={dateBounds?.max}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            {(from || to) && (
              <button
                type="button"
                className={`btn btn-ghost btn-icon ${styles.dateClear}`}
                aria-label="Clear date range"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <span className={styles.count}>
          {sorted.length} {sorted.length === 1 ? "transaction" : "transactions"}
        </span>

        {sorted.length === 0 ? (
          <p className="empty">No transactions match these filters.</p>
        ) : (
          <ul className={styles.list}>
            {sorted.map((e) => (
              <EntryItem
                key={`${e.kind}:${e.id}`}
                entry={e}
                category={resolve(e)}
                baseCurrency={baseCurrency}
                rates={rates}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}
