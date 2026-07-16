import { useState } from "react";
import type { Category, EntryKind, RecurringRule } from "../types";
import { CURRENCIES, OTHER_EXPENSE_ID } from "../lib/constants";
import { todayISO } from "../lib/dates";
import { formatMoney } from "../lib/currency";
import { nextDue } from "../lib/recurring";
import styles from "./RecurringPanel.module.css";

interface Props {
  categories: Category[];
  incomeCategories: Category[];
  recurring: RecurringRule[];
  onAdd: (data: Omit<RecurringRule, "id">) => void;
  onUpdate: (id: string, data: Partial<Omit<RecurringRule, "id">>) => void;
  onDelete: (id: string) => void;
}

interface FormState {
  kind: EntryKind;
  amount: string;
  currency: string;
  categoryId: string;
  dayOfMonth: string;
  note: string;
}

function blank(kind: EntryKind, kindCategories: Category[]): FormState {
  return {
    kind,
    amount: "",
    currency: "USD",
    categoryId: kindCategories[0]?.id ?? OTHER_EXPENSE_ID,
    dayOfMonth: "1",
    note: "",
  };
}

export function RecurringPanel({
  categories,
  incomeCategories,
  recurring,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const listFor = (kind: EntryKind) =>
    kind === "income" ? incomeCategories : categories;

  const [form, setForm] = useState<FormState>(() => blank("expense", categories));
  const isIncome = form.kind === "income";
  const activeCategories = listFor(form.kind);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function switchKind(kind: EntryKind) {
    setForm((f) => ({
      ...f,
      kind,
      categoryId: listFor(kind)[0]?.id ?? OTHER_EXPENSE_ID,
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    const dayOfMonth = parseInt(form.dayOfMonth, 10);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return;
    onAdd({
      kind: form.kind,
      amount,
      currency: form.currency,
      categoryId: form.categoryId,
      dayOfMonth,
      note: form.note.trim() || undefined,
      startDate: todayISO(),
      enabled: true,
    });
    setForm(blank(form.kind, activeCategories));
  }

  function labelFor(rule: RecurringRule): string {
    return listFor(rule.kind).find((c) => c.id === rule.categoryId)?.name ?? "Unknown";
  }

  const now = new Date();

  return (
    <div className="card">
      <h2>Recurring transactions</h2>

      {recurring.length === 0 ? (
        <p className="empty">No recurring transactions yet. Add one below.</p>
      ) : (
        <ul className={styles.list}>
          {recurring.map((rule) => (
            <li key={rule.id} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.name}>
                  {labelFor(rule)}
                  {!rule.enabled && <span className={styles.paused}> · paused</span>}
                </span>
                <span
                  className={`${styles.amount} ${rule.kind === "income" ? styles.income : ""}`}
                >
                  {rule.kind === "income" ? "+" : "−"}
                  {formatMoney(rule.amount, rule.currency)}
                </span>
              </div>
              <div className={styles.rowMeta}>
                <span className="muted">
                  Day {rule.dayOfMonth} of month · next {nextDue(rule, now)}
                </span>
                <div className={styles.rowActions}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => onUpdate(rule.id, { enabled: !rule.enabled })}
                  >
                    {rule.enabled ? "Pause" : "Resume"}
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-danger"
                    aria-label={`Delete ${labelFor(rule)} recurring rule`}
                    onClick={() => onDelete(rule.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.add} onSubmit={submit}>
        <div
          className={styles.kindToggle}
          role="group"
          aria-label="Recurring type"
        >
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

        <div className={styles.amountRow}>
          <div className="field">
            <label htmlFor="recurring-amount">Amount</label>
            <input
              id="recurring-amount"
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
            <label htmlFor="recurring-currency">Currency</label>
            <select
              id="recurring-currency"
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
          <label htmlFor="recurring-category">Category</label>
          <select
            id="recurring-category"
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
          <label htmlFor="recurring-day">Day of month</label>
          <input
            id="recurring-day"
            className="input"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={form.dayOfMonth}
            onChange={(e) => update("dayOfMonth", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="recurring-note">Note (optional)</label>
          <input
            id="recurring-note"
            className="input"
            type="text"
            placeholder="e.g. Rent"
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Add
        </button>

        <p className="muted" style={{ fontSize: "0.78rem" }}>
          Materializes as a real transaction each month on this day, next time
          the app is open. Day 29–31 falls back to the month's last day when
          it's shorter.
        </p>
      </form>
    </div>
  );
}
