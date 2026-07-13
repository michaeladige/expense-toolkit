import { useEffect, useState } from "react";
import type { Category, Expense } from "../types";
import { CURRENCIES } from "../lib/constants";
import { todayISO } from "../lib/dates";
import styles from "./ExpenseForm.module.css";

interface Props {
  categories: Category[];
  defaultCurrency: string;
  editing: Expense | null;
  onSubmit: (data: Omit<Expense, "id" | "createdAt">) => void;
  onCancelEdit: () => void;
}

interface FormState {
  amount: string;
  currency: string;
  categoryId: string;
  date: string;
  note: string;
}

function blank(categories: Category[], currency: string): FormState {
  return {
    amount: "",
    currency,
    categoryId: categories[0]?.id ?? "other",
    date: todayISO(),
    note: "",
  };
}

export function ExpenseForm({
  categories,
  defaultCurrency,
  editing,
  onSubmit,
  onCancelEdit,
}: Props) {
  const [form, setForm] = useState<FormState>(() =>
    blank(categories, defaultCurrency)
  );

  useEffect(() => {
    if (editing) {
      setForm({
        amount: String(editing.amount),
        currency: editing.currency,
        categoryId: editing.categoryId,
        date: editing.date,
        note: editing.note ?? "",
      });
    } else {
      setForm(blank(categories, defaultCurrency));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, defaultCurrency]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onSubmit({
      amount,
      currency: form.currency,
      categoryId: form.categoryId,
      date: form.date,
      note: form.note.trim() || undefined,
    });
    if (!editing) {
      setForm((f) => ({ ...blank(categories, f.currency), date: f.date }));
    }
  }

  return (
    <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
      <h2>{editing ? "Edit expense" : "Add expense"}</h2>

      <div className={styles.amountRow}>
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            className="select"
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          className="select"
          value={form.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          className="input"
          type="date"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="note">Note (optional)</label>
        <input
          id="note"
          className="input"
          type="text"
          placeholder="e.g. Lunch with team"
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary">
          {editing ? "Save changes" : "Add expense"}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
