import { useState } from "react";
import type { Budget, Category } from "../types";
import { formatMoney } from "../lib/currency";
import styles from "./BudgetPanel.module.css";

interface Props {
  categories: Category[];
  budgets: Budget[];
  /** Spend for the visible month, per category id, in base currency. */
  monthSpentByCategory: Record<string, number>;
  /** Total spend for the visible month in base currency. */
  monthTotal: number;
  baseCurrency: string;
  monthLabel: string;
  onSetBudget: (categoryId: string, amount: number) => void;
  onRemoveBudget: (id: string) => void;
}

function barColor(ratio: number): string {
  if (ratio >= 1) return "var(--danger)";
  if (ratio >= 0.8) return "var(--warning)";
  return "var(--success)";
}

export function BudgetPanel({
  categories,
  budgets,
  monthSpentByCategory,
  monthTotal,
  baseCurrency,
  monthLabel,
  onSetBudget,
  onRemoveBudget,
}: Props) {
  const [catId, setCatId] = useState<string>("all");
  const [amount, setAmount] = useState<string>("");

  function labelFor(id: string): string {
    if (id === "all") return "Overall";
    return categories.find((c) => c.id === id)?.name ?? "Unknown";
  }
  function spentFor(id: string): number {
    return id === "all" ? monthTotal : monthSpentByCategory[id] ?? 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!Number.isFinite(a) || a <= 0) return;
    onSetBudget(catId, a);
    setAmount("");
  }

  const sorted = [...budgets].sort((a, b) =>
    a.categoryId === "all" ? -1 : b.categoryId === "all" ? 1 : 0
  );

  return (
    <div className="card">
      <h2>Budgets · {monthLabel}</h2>

      {sorted.length === 0 ? (
        <p className="empty">No budgets set. Add one below.</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((b) => {
            const spent = spentFor(b.categoryId);
            const ratio = b.amount > 0 ? spent / b.amount : 0;
            const pct = Math.min(ratio, 1) * 100;
            return (
              <li key={b.id} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.name}>{labelFor(b.categoryId)}</span>
                  <span className={styles.figures}>
                    {formatMoney(spent, baseCurrency)} /{" "}
                    {formatMoney(b.amount, baseCurrency)}
                  </span>
                  <button
                    className="btn btn-ghost btn-icon btn-danger"
                    aria-label={`Remove ${labelFor(b.categoryId)} budget`}
                    onClick={() => onRemoveBudget(b.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${pct}%`, background: barColor(ratio) }}
                  />
                </div>
                {ratio >= 1 && (
                  <span className={styles.over}>
                    Over by {formatMoney(spent - b.amount, baseCurrency)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form className={styles.add} onSubmit={submit}>
        <select
          className="select"
          value={catId}
          onChange={(e) => setCatId(e.target.value)}
          aria-label="Budget category"
        >
          <option value="all">Overall</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          placeholder={`Limit (${baseCurrency})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Set
        </button>
      </form>
    </div>
  );
}
