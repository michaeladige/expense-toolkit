import type { Category, RateMap, TaggedEntry } from "../types";
import { convert, formatMoney } from "../lib/currency";
import { fromISODate } from "../lib/dates";
import styles from "./EntryList.module.css";

interface Props {
  entry: TaggedEntry;
  category: Category | undefined;
  baseCurrency: string;
  rates: RateMap;
  onEdit: (e: TaggedEntry) => void;
  onDelete: (e: TaggedEntry) => void;
  onDuplicate: (e: TaggedEntry) => void;
}

export function EntryItem({
  entry,
  category,
  baseCurrency,
  rates,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const converted =
    entry.currency !== baseCurrency
      ? convert(entry.amount, entry.currency, baseCurrency, rates)
      : null;

  const isIncome = entry.kind === "income";
  const color = category?.color ?? "var(--text-muted)";
  const noun = isIncome ? "income" : "expense";

  return (
    <li className={styles.item}>
      <span
        className={styles.icon}
        style={{ background: `${color}22`, color }}
        aria-hidden
      >
        {category?.icon ?? "•"}
      </span>

      <div className={styles.main}>
        <span className={styles.title}>{category?.name ?? "Uncategorized"}</span>

        <div className={styles.bottomRow}>
          <span className={styles.sub}>
            {fromISODate(entry.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
            {entry.note ? ` · ${entry.note}` : ""}
          </span>

          <div className={styles.amountActions}>
            <div className={styles.amount}>
              <span
                className={`${styles.primaryAmount} ${isIncome ? styles.incomeAmount : ""}`}
              >
                {isIncome ? "+" : "−"}
                {formatMoney(entry.amount, entry.currency)}
              </span>
              {converted != null && (
                <span className={styles.convertedAmount}>
                  ≈ {formatMoney(converted, baseCurrency)}
                </span>
              )}
            </div>

            <div className={styles.rowActions}>
              <button
                className="btn btn-ghost btn-icon"
                aria-label={`Duplicate ${noun}`}
                onClick={() => onDuplicate(entry)}
              >
                ⧉
              </button>
              <button
                className="btn btn-ghost btn-icon"
                aria-label={`Edit ${noun}`}
                onClick={() => onEdit(entry)}
              >
                ✎
              </button>
              <button
                className="btn btn-ghost btn-icon btn-danger"
                aria-label={`Delete ${noun}`}
                onClick={() => onDelete(entry)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
