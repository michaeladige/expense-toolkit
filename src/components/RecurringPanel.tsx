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
import { useI18n } from "../lib/i18n/I18nContext";
import type { TFn } from "../lib/i18n/translate";
import { displayCategoryName } from "../lib/i18n/categoryName";
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

/** Weekday option values; labels come from `weekday.long.<value>`. Monday-first
 *  to match the app's week convention. */
const WEEKDAY_VALUES = ["1", "2", "3", "4", "5", "6", "0"];

/** The anchors offered for a frequency. Each has its own "specific day" one. */
function anchorOptions(
  frequency: RecurringFrequency,
  t: TFn
): { value: RecurringAnchor; label: string }[] {
  const unit = t(frequency === "week" ? "unit.week" : "unit.month");
  return [
    frequency === "week"
      ? { value: "day-of-week", label: t("recurring.anchor.dayOfWeek") }
      : { value: "day-of-month", label: t("recurring.anchor.dayOfMonth") },
    { value: "first-working-day", label: t("recurring.anchor.firstWorkingDay", { unit }) },
    { value: "last-working-day", label: t("recurring.anchor.lastWorkingDay", { unit }) },
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
  const { t, lang } = useI18n();
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
    const cat = listFor(rule.kind).find((c) => c.id === rule.categoryId);
    return cat ? displayCategoryName(cat, lang) : t("budget.unknown");
  }

  /** True when the date was computed without the holiday data it depends on. */
  function isApproximate(rule: RecurringRule, dateISO: string): boolean {
    if (!isWorkingDayAnchor(resolveSchedule(rule).anchor)) return false;
    return !knownYears.has(Number(dateISO.slice(0, 4)));
  }

  return (
    <div className="card">
      <h2>{t("recurring.title")}</h2>

      {recurring.length === 0 ? (
        <p className="empty">{t("recurring.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {recurring.map((rule) => {
            const due = nextDue(rule, calendar);
            return (
              <li key={rule.id} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.name}>
                    {labelFor(rule)}
                    {!rule.enabled && <span className={styles.paused}>{t("recurring.paused")}</span>}
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
                    {describeSchedule(rule, t)} · {t("recurring.next")}{" "}
                    {due === null ? (
                      "—"
                    ) : isApproximate(rule, due) ? (
                      <span title={t("recurring.approxTitle")}>
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
                      {rule.enabled ? t("recurring.pause") : t("recurring.resume")}
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-danger"
                      aria-label={t("recurring.deleteAria", { name: labelFor(rule) })}
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
          aria-label={t("recurring.typeAria")}
        >
          <button
            type="button"
            className={`${styles.kindBtn} ${!isIncome ? styles.kindActive : ""}`}
            aria-pressed={!isIncome}
            onClick={() => switchKind("expense")}
          >
            {t("kind.expense")}
          </button>
          <button
            type="button"
            className={`${styles.kindBtn} ${isIncome ? styles.kindActiveIncome : ""}`}
            aria-pressed={isIncome}
            onClick={() => switchKind("income")}
          >
            {t("kind.income")}
          </button>
        </div>

        <div className={styles.amountRow}>
          <div className="field">
            <label htmlFor="recurring-amount">{t("field.amount")}</label>
            <input
              id="recurring-amount"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder={t("common.amountPlaceholder")}
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="recurring-currency">{t("field.currency")}</label>
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
          <label htmlFor="recurring-category">{t("field.category")}</label>
          <select
            id="recurring-category"
            className="select"
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
          >
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {displayCategoryName(c, lang)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.kindToggle} role="group" aria-label={t("recurring.repeatsAria")}>
          <button
            type="button"
            className={`${styles.kindBtn} ${!isWeekly ? styles.kindActive : ""}`}
            aria-pressed={!isWeekly}
            onClick={() => switchFrequency("month")}
          >
            {t("recurring.monthly")}
          </button>
          <button
            type="button"
            className={`${styles.kindBtn} ${isWeekly ? styles.kindActive : ""}`}
            aria-pressed={isWeekly}
            onClick={() => switchFrequency("week")}
          >
            {t("recurring.weekly")}
          </button>
        </div>

        <div className="field">
          <label htmlFor="recurring-anchor">{t("recurring.fallsOn")}</label>
          <select
            id="recurring-anchor"
            className="select"
            value={form.anchor}
            onChange={(e) => update("anchor", e.target.value as RecurringAnchor)}
          >
            {anchorOptions(form.frequency, t).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {form.anchor === "day-of-month" && (
          <div className="field">
            <label htmlFor="recurring-day">{t("recurring.dayOfMonth")}</label>
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
            <label htmlFor="recurring-weekday">{t("recurring.weekday")}</label>
            <select
              id="recurring-weekday"
              className="select"
              value={form.dayOfWeek}
              onChange={(e) => update("dayOfWeek", e.target.value)}
            >
              {WEEKDAY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t(`weekday.long.${v}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="recurring-note">{t("common.note")}</label>
          <input
            id="recurring-note"
            className="input"
            type="text"
            placeholder={t("recurring.notePlaceholder")}
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {t("common.add")}
        </button>

        <p className="muted" style={{ fontSize: "0.78rem" }}>
          {t("recurring.helpBase", { unit: t(isWeekly ? "unit.week" : "unit.month") })}{" "}
          {form.anchor === "day-of-month" && `${t("recurring.helpClamp")} `}
          {isWorkingDayAnchor(form.anchor) &&
            `${holidayCountry ? t("recurring.helpWorkHoliday") : t("recurring.helpWorkWeekend")} `}
          {t("recurring.helpEdit", { unit: t(isWeekly ? "unit.week" : "unit.month") })}
        </p>
      </form>
    </div>
  );
}
