import type { Category, Expense, RateMap } from "../types";
import { convert, formatMoney } from "../lib/currency";
import { fromISODate } from "../lib/dates";
import styles from "./ExpenseList.module.css";

interface Props {
  expense: Expense;
  category: Category | undefined;
  baseCurrency: string;
  rates: RateMap;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseItem({
  expense,
  category,
  baseCurrency,
  rates,
  onEdit,
  onDelete,
}: Props) {
  const converted =
    expense.currency !== baseCurrency
      ? convert(expense.amount, expense.currency, baseCurrency, rates)
      : null;

  const color = category?.color ?? "var(--text-muted)";

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
        <span className={styles.title}>
          {category?.name ?? "Uncategorized"}
        </span>
        <span className={styles.sub}>
          {fromISODate(expense.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
          {expense.note ? ` · ${expense.note}` : ""}
        </span>
      </div>

      <div className={styles.amount}>
        <span className={styles.primaryAmount}>
          {formatMoney(expense.amount, expense.currency)}
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
          aria-label="Edit expense"
          onClick={() => onEdit(expense)}
        >
          ✎
        </button>
        <button
          className="btn btn-ghost btn-icon btn-danger"
          aria-label="Delete expense"
          onClick={() => onDelete(expense.id)}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
