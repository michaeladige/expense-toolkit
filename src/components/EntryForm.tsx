import { useEffect, useState } from "react";
import type { Category, EntryKind, Expense, TaggedEntry } from "../types";
import type { Favorite } from "../lib/favorites";
import { CURRENCIES, OTHER_EXPENSE_ID } from "../lib/constants";
import { todayISO } from "../lib/dates";
import { formatMoney } from "../lib/currency";
import styles from "./EntryForm.module.css";

interface Props {
  categories: Category[];
  incomeCategories: Category[];
  defaultCurrency: string;
  editing: TaggedEntry | null;
  favorites: Favorite[];
  onSubmit: (kind: EntryKind, data: Omit<Expense, "id" | "createdAt">) => void;
  onCancelEdit: () => void;
}

interface FormState {
  kind: EntryKind;
  amount: string;
  currency: string;
  categoryId: string;
  date: string;
  note: string;
}

/** `kindCategories` must be the list for `kind`, not the expense list. */
function blank(
  kind: EntryKind,
  kindCategories: Category[],
  currency: string
): FormState {
  return {
    kind,
    amount: "",
    currency,
    categoryId: kindCategories[0]?.id ?? OTHER_EXPENSE_ID,
    date: todayISO(),
    note: "",
  };
}

export function EntryForm({
  categories,
  incomeCategories,
  defaultCurrency,
  editing,
  favorites,
  onSubmit,
  onCancelEdit,
}: Props) {
  /** Each side has its own categories; a form field must never mix them. */
  const listFor = (kind: EntryKind) =>
    kind === "income" ? incomeCategories : categories;

  const [form, setForm] = useState<FormState>(() =>
    blank("expense", categories, defaultCurrency)
  );

  const isIncome = form.kind === "income";
  const activeCategories = listFor(form.kind);

  useEffect(() => {
    if (editing) {
      setForm({
        kind: editing.kind,
        amount: String(editing.amount),
        currency: editing.currency,
        categoryId: editing.categoryId,
        date: editing.date,
        note: editing.note ?? "",
      });
    } else {
      setForm((f) => blank(f.kind, listFor(f.kind), defaultCurrency));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, defaultCurrency]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Switching side must also move the category to one that exists on that side. */
  function switchKind(kind: EntryKind) {
    setForm((f) => ({
      ...f,
      kind,
      categoryId: listFor(kind)[0]?.id ?? OTHER_EXPENSE_ID,
    }));
  }

  /** Prefills the form from a favorite; the user still reviews and hits Save —
   *  there's no undo in this app, so a one-tap silent write is the wrong default. */
  function applyFavorite(fav: Favorite) {
    setForm({
      kind: fav.kind,
      amount: String(fav.amount),
      currency: fav.currency,
      categoryId: fav.categoryId,
      date: todayISO(),
      note: "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onSubmit(form.kind, {
      amount,
      currency: form.currency,
      categoryId: form.categoryId,
      date: form.date,
      note: form.note.trim() || undefined,
    });
    if (!editing) {
      setForm((f) => ({ ...blank(f.kind, listFor(f.kind), f.currency), date: f.date }));
    }
  }

  const noun = isIncome ? "income" : "expense";

  return (
    <form className={`card ${styles.form}`} onSubmit={handleSubmit}>
      <h2>{editing ? `Edit ${noun}` : `Add ${noun}`}</h2>

      {!editing && favorites.length > 0 && (
        <div className={styles.favorites} role="group" aria-label="Quick add">
          {favorites.map((fav) => {
            const cat = listFor(fav.kind).find((c) => c.id === fav.categoryId);
            return (
              <button
                key={`${fav.kind}:${fav.categoryId}:${fav.amount}:${fav.currency}`}
                type="button"
                className={styles.favoriteChip}
                style={{ borderColor: `${cat?.color ?? "var(--border)"}66` }}
                onClick={() => applyFavorite(fav)}
              >
                <span aria-hidden>{cat?.icon ?? "•"}</span>
                {cat?.name ?? "Uncategorized"} · {formatMoney(fav.amount, fav.currency)}
              </button>
            );
          })}
        </div>
      )}

      {/* Kind is fixed while editing: moving an entry across sides also means
          re-categorising it, so that's a delete-and-re-add, not a toggle. */}
      {!editing && (
        <div className={styles.kindToggle} role="group" aria-label="Entry type">
          <button
            type="button"
            className={`${styles.kindBtn} ${!isIncome ? styles.kindActive : ""}`}
            aria-pressed={!isIncome}
            onClick={() => switchKind("expense")}
          >
            Expense
          </button>
          <button
            type="button"
            className={`${styles.kindBtn} ${isIncome ? styles.kindActiveIncome : ""}`}
            aria-pressed={isIncome}
            onClick={() => switchKind("income")}
          >
            Income
          </button>
        </div>
      )}

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
          {activeCategories.map((c) => (
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
          placeholder={isIncome ? "e.g. March salary" : "e.g. Lunch with team"}
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary">
          {editing ? "Save changes" : `Add ${noun}`}
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
