import { useState } from "react";
import type { Category, RateMap, TaggedEntry } from "../types";
import { EntryItem } from "./EntryItem";
import { FILTERS, byRecency, type Filter } from "../lib/entryFilters";
import styles from "./EntryList.module.css";

/** How many rows the collapsed main-view list shows before "View all". */
const COLLAPSED_COUNT = 3;

interface Props {
  entries: TaggedEntry[];
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  baseCurrency: string;
  rates: RateMap;
  onEdit: (e: TaggedEntry) => void;
  onDelete: (e: TaggedEntry) => void;
  onDuplicate: (e: TaggedEntry) => void;
  onViewAll: () => void;
}

export function EntryList({
  entries,
  categoryById,
  incomeCategoryById,
  baseCurrency,
  rates,
  onEdit,
  onDelete,
  onDuplicate,
  onViewAll,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = entries.filter((e) => filter === "all" || e.kind === filter);
  const sorted = [...visible].sort(byRecency);
  const shown = sorted.slice(0, COLLAPSED_COUNT);

  return (
    <div className="card">
      <div className={styles.listHeader}>
        <h2>Transactions ({visible.length})</h2>
        <div className={styles.filters} role="group" aria-label="Filter transactions">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="empty">
          {filter === "all"
            ? "No transactions in this period yet."
            : `No ${filter === "income" ? "income" : "expenses"} in this period yet.`}
        </p>
      ) : (
        <>
          <ul className={styles.list}>
            {shown.map((e) => (
              <EntryItem
                key={`${e.kind}:${e.id}`}
                entry={e}
                category={
                  e.kind === "income"
                    ? incomeCategoryById(e.categoryId)
                    : categoryById(e.categoryId)
                }
                baseCurrency={baseCurrency}
                rates={rates}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </ul>
          {sorted.length > COLLAPSED_COUNT && (
            <button
              type="button"
              className={`btn btn-ghost ${styles.viewAll}`}
              onClick={onViewAll}
            >
              View all {sorted.length} transactions
            </button>
          )}
        </>
      )}
    </div>
  );
}
