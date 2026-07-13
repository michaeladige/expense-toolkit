import type { Category, Expense, RateMap } from "../types";
import { ExpenseItem } from "./ExpenseItem";
import styles from "./ExpenseList.module.css";

interface Props {
  expenses: Expense[];
  categoryById: (id: string) => Category | undefined;
  baseCurrency: string;
  rates: RateMap;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({
  expenses,
  categoryById,
  baseCurrency,
  rates,
  onEdit,
  onDelete,
}: Props) {
  const sorted = [...expenses].sort((a, b) =>
    a.date === b.date
      ? b.createdAt.localeCompare(a.createdAt)
      : b.date.localeCompare(a.date)
  );

  return (
    <div className="card">
      <h2>Expenses ({expenses.length})</h2>
      {sorted.length === 0 ? (
        <p className="empty">No expenses in this period yet.</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((e) => (
            <ExpenseItem
              key={e.id}
              expense={e}
              category={categoryById(e.categoryId)}
              baseCurrency={baseCurrency}
              rates={rates}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
