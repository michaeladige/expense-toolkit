import { useState } from "react";
import type { Category, RateMap, TaggedEntry } from "../types";
import { EntryItem } from "./EntryItem";
import { FILTERS, byRecency, type Filter } from "../lib/entryFilters";
import { useI18n } from "../lib/i18n/I18nContext";
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
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = entries.filter((e) => filter === "all" || e.kind === filter);
  const sorted = [...visible].sort(byRecency);
  const shown = sorted.slice(0, COLLAPSED_COUNT);

  return (
    <div className="card">
      <div className={styles.listHeader}>
        <h2>{t("list.transactions", { n: visible.length })}</h2>
        <div className={styles.filters} role="group" aria-label={t("list.filterAria")}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {t(`filter.${f.id}`)}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="empty">
          {filter === "all"
            ? t("list.emptyAll")
            : filter === "income"
              ? t("list.emptyIncome")
              : t("list.emptyExpense")}
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
              {t("list.viewAll", { n: sorted.length })}
            </button>
          )}
        </>
      )}
    </div>
  );
}
