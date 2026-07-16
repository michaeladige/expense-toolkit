import { useState } from "react";
import type {
  Category,
  EntryKind,
  RecurringAnchor,
  RecurringFrequency,
  RecurringRule,
} from "../types";
import { CURRENCIES, OTHER_EXPENSE_ID } from "../lib/constants";
import { todayISO } from "../lib/dates";
import { formatMoney } from "../lib/currency";
import {
  describeSchedule,
  isWorkingDayAnchor,
  nextDue,
  resolveSchedule,
} from "../lib/recurring";
import type { WorkCalendar } from "../lib/workdays";
import styles from "./RecurringPanel.module.css";

interface Props {
  categories: Category[];
  incomeCategories: Category[];
  recurring: RecurringRule[];
  defaultCurrency: string;
  calendar: WorkCalendar;
  /** Years the holiday cache covers; a date outside them may still shift. */
  knownYears: ReadonlySet<number>;
  /** Undefined when no holiday calendar is configured. */
  holidayCountry?: string;
  onAdd: (data: Omit<RecurringRule, "id">) => void;
  onUpdate: (id: string, data: Partial<Omit<RecurringRule, "id">>) => void;
  onDelete: (id: string) => void;
}

interface FormState {
  kind: EntryKind;
  amount: string;
  currency: string;
  categoryId: string;
  frequency: RecurringFrequency;
  anchor: RecurringAnchor;
  dayOfMonth: string;
  dayOfWeek: string;
  note: string;
}

const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

/** The anchors offered for a frequency. Each has its own "specific day" one. */
function anchorOptions(
  frequency: RecurringFrequency
): { value: RecurringAnchor; label: string }[] {
  const unit = frequency === "week" ? "week" : "month";
  return [
    frequency === "week"
      ? { value: "day-of-week", label: "A specific weekday" }
      : { value: "day-of-month", label: "A specific day of the month" },
    { value: "first-working-day", label: `First working day of ${unit}` },
    { value: "last-working-day", label: `Last working day of ${unit}` },
  ];
}

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
    frequency: "month",
    anchor: "day-of-month",
    dayOfMonth: "1",
    dayOfWeek: "1",
    note: "",
  };
}

export function RecurringPanel({
  categories,
  incomeCategories,
  recurring,
  defaultCurrency,
  calendar,
  knownYears,
  holidayCountry,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const listFor = (kind: EntryKind) =>
    kind === "income" ? incomeCategories : categories;

  const [form, setForm] = useState<FormState>(() =>
    blank("expense", categories, defaultCurrency)
  );
  const isIncome = form.kind === "income";
  const isWeekly = form.frequency === "week";
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

  function switchFrequency(frequency: RecurringFrequency) {
    setForm((f) => {
      // Carry the intent across: the two "specific day" anchors are each
      // other's equivalent, and the working-day ones apply to both.
      let anchor = f.anchor;
      if (frequency === "week" && anchor === "day-of-month") anchor = "day-of-week";
      if (frequency === "month" && anchor === "day-of-week") anchor = "day-of-month";
      return { ...f, frequency, anchor };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const dayOfMonth = parseInt(form.dayOfMonth, 10);
    if (form.anchor === "day-of-month") {
      if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return;
    }

    onAdd({
      kind: form.kind,
      amount,
      currency: form.currency,
      categoryId: form.categoryId,
      frequency: form.frequency,
      anchor: form.anchor,
      // Only persist the field its anchor actually uses, so a rule can't carry
      // a stale day that contradicts the schedule it's shown with.
      dayOfMonth: form.anchor === "day-of-month" ? dayOfMonth : undefined,
      dayOfWeek:
        form.anchor === "day-of-week" ? parseInt(form.dayOfWeek, 10) : undefined,
      note: form.note.trim() || undefined,
      startDate: todayISO(),
      enabled: true,
    });
    setForm(blank(form.kind, activeCategories, defaultCurrency));
  }

  function labelFor(rule: RecurringRule): string {
    return listFor(rule.kind).find((c) => c.id === rule.categoryId)?.name ?? "Unknown";
  }

  /** True when the date was computed without the holiday data it depends on. */
  function isApproximate(rule: RecurringRule, dateISO: string): boolean {
    if (!isWorkingDayAnchor(resolveSchedule(rule).anchor)) return false;
    return !knownYears.has(Number(dateISO.slice(0, 4)));
  }

  return (
    <div className="card">
      <h2>Recurring transactions</h2>

      {recurring.length === 0 ? (
        <p className="empty">No recurring transactions yet. Add one below.</p>
      ) : (
        <ul className={styles.list}>
          {recurring.map((rule) => {
            const due = nextDue(rule, calendar);
            return (
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
                    {describeSchedule(rule)} · next{" "}
                    {due === null ? (
                      "—"
                    ) : isApproximate(rule, due) ? (
                      <span title="Holiday data for this year isn't loaded, so the date may shift once it is.">
                        ≈{due}
                      </span>
                    ) : (
                      due
                    )}
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
            );
          })}
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

        <div className={styles.kindToggle} role="group" aria-label="Repeats">
          <button
            type="button"
            className={`${styles.kindBtn} ${!isWeekly ? styles.kindActive : ""}`}
            aria-pressed={!isWeekly}
            onClick={() => switchFrequency("month")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`${styles.kindBtn} ${isWeekly ? styles.kindActive : ""}`}
            aria-pressed={isWeekly}
            onClick={() => switchFrequency("week")}
          >
            Weekly
          </button>
        </div>

        <div className="field">
          <label htmlFor="recurring-anchor">Falls on</label>
          <select
            id="recurring-anchor"
            className="select"
            value={form.anchor}
            onChange={(e) => update("anchor", e.target.value as RecurringAnchor)}
          >
            {anchorOptions(form.frequency).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {form.anchor === "day-of-month" && (
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
        )}

        {form.anchor === "day-of-week" && (
          <div className="field">
            <label htmlFor="recurring-weekday">Weekday</label>
            <select
              id="recurring-weekday"
              className="select"
              value={form.dayOfWeek}
              onChange={(e) => update("dayOfWeek", e.target.value)}
            >
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

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
          Materializes as a real transaction each {isWeekly ? "week" : "month"},
          next time the app is open.{" "}
          {form.anchor === "day-of-month" &&
            "Day 29–31 falls back to the month's last day when it's shorter. "}
          {isWorkingDayAnchor(form.anchor) &&
            (holidayCountry
              ? "Working days skip weekends and public holidays. "
              : "Working days skip weekends only — pick a holiday calendar in Settings to also skip public holidays. ")}
          Editing a rule takes effect from the next {isWeekly ? "week" : "month"};
          the current one is never re-applied.
        </p>
      </form>
    </div>
  );
}
