import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type {
  Category,
  EntryKind,
  Expense,
  Income,
  TaggedEntry,
} from "../types";
import type { Favorite } from "../lib/favorites";
import type { WorkCalendar } from "../lib/workdays";
import { CURRENCIES, OTHER_EXPENSE_ID } from "../lib/constants";
import { fromISODate } from "../lib/dates";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import { displayCategoryName } from "../lib/i18n/categoryName";
import styles from "./CatchUpSheet.module.css";

interface Props {
  /** The days to walk, oldest first. Fixed when the sheet opens, so logging a
   *  day doesn't reshuffle the list (and the progress bar) under the user. */
  days: string[];
  expenses: Expense[];
  incomes: Income[];
  categories: Category[];
  incomeCategories: Category[];
  favorites: Favorite[];
  defaultCurrency: string;
  calendar: WorkCalendar;
  noSpendDays: readonly string[];
  onAdd: (kind: EntryKind, data: Omit<Expense, "id" | "createdAt">) => void;
  onDelete: (entry: TaggedEntry) => void;
  onSetNoSpend: (date: string, on: boolean) => void;
  onClose: () => void;
}

/**
 * Tracks the visual viewport so the sheet can shrink to the area above the
 * on-screen keyboard. Without it, on mobile the keyboard covers the sticky
 * action bar, which is exactly the button you need between entries.
 */
function useVisualViewport(): { height: number; top: number } | null {
  const [vv, setVv] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const update = () => setVv({ height: v.height, top: v.offsetTop });
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
    };
  }, []);
  return vv;
}

export function CatchUpSheet({
  days,
  expenses,
  incomes,
  categories,
  incomeCategories,
  favorites,
  defaultCurrency,
  calendar,
  noSpendDays,
  onAdd,
  onDelete,
  onSetNoSpend,
  onClose,
}: Props) {
  const { t, lang, locale } = useI18n();
  const listFor = (k: EntryKind) => (k === "income" ? incomeCategories : categories);

  // Entries per day, both sides, for the days in this session only.
  const byDay = useMemo(() => {
    const wanted = new Set(days);
    const map = new Map<string, TaggedEntry[]>();
    const push = (e: TaggedEntry) => {
      if (!wanted.has(e.date)) return;
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    };
    for (const e of expenses) push({ ...e, kind: "expense" });
    for (const e of incomes) push({ ...e, kind: "income" });
    return map;
  }, [days, expenses, incomes]);

  const noSpend = useMemo(() => new Set(noSpendDays), [noSpendDays]);

  // Same definition as `loggedDays`: a recurring entry alone doesn't count.
  const isDone = (day: string) =>
    noSpend.has(day) || (byDay.get(day) ?? []).some((e) => !e.recurringId);

  const doneCount = days.filter(isDone).length;
  const allDone = doneCount === days.length;

  // Start on the first day still open, not blindly on day one — reopening the
  // sheet halfway through should resume, not restart.
  const [index, setIndex] = useState(() => {
    const i = days.findIndex((d) => !isDone(d));
    return i === -1 ? 0 : i;
  });
  const day = days[index];
  const isLast = index === days.length - 1;

  const [kind, setKind] = useState<EntryKind>("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? OTHER_EXPENSE_ID);
  const [note, setNote] = useState("");

  const amountRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const vv = useVisualViewport();

  // Lock page scroll behind the sheet, and let Escape close it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Keep the active day chip visible as you step through.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-day="${day}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [day]);

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(days.length - 1, i)));
    setAmount("");
    setNote("");
  }

  function switchKind(k: EntryKind) {
    setKind(k);
    setCategoryId(listFor(k)[0]?.id ?? OTHER_EXPENSE_ID);
  }

  function applyFavorite(fav: Favorite) {
    setKind(fav.kind);
    setCategoryId(fav.categoryId);
    setCurrency(fav.currency);
    setAmount(String(fav.amount));
    amountRef.current?.focus();
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    onAdd(kind, {
      amount: value,
      currency,
      categoryId,
      date: day,
      note: note.trim() || undefined,
    });
    // A day with a real entry isn't a no-spend day any more.
    if (noSpend.has(day)) onSetNoSpend(day, false);
    setAmount("");
    setNote("");
    // Keep the keyboard up: the next entry for the same day is the common case.
    amountRef.current?.focus();
  }

  function markNoSpend() {
    onSetNoSpend(day, true);
    if (!isLast) goTo(index + 1);
  }

  const date = fromISODate(day);
  const dow = date.getDay();
  const tag = calendar.holidays.has(day)
    ? t("catchUp.holiday")
    : (dow === 0 || dow === 6) && !calendar.workdays.has(day)
      ? t("catchUp.weekend")
      : null;

  const entries = byDay.get(day) ?? [];
  const manualCount = entries.filter((e) => !e.recurringId).length;
  const dayNoSpend = noSpend.has(day);
  const amountValid = parseFloat(amount) > 0;
  const activeCategories = listFor(kind);

  const vvStyle = vv
    ? ({ "--vvh": `${vv.height}px`, "--vvtop": `${vv.top}px` } as CSSProperties)
    : undefined;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <form
        className={styles.sheet}
        style={vvStyle}
        role="dialog"
        aria-modal="true"
        aria-label={t("catchUp.title")}
        onSubmit={handleAdd}
      >
        <header className={styles.header}>
          <div className={styles.headTop}>
            <h2 className={styles.heading}>{t("catchUp.title")}</h2>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label={t("catchUp.close")}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={days.length}
            aria-valuenow={doneCount}
          >
            <span style={{ width: `${(doneCount / days.length) * 100}%` }} />
          </div>
          <span className={styles.progressLabel}>
            {allDone
              ? t("catchUp.allDone")
              : t("catchUp.progress", { done: doneCount, total: days.length })}
          </span>

          <div className={styles.strip} ref={stripRef}>
            {days.map((d, i) => {
              const dd = fromISODate(d);
              return (
                <button
                  key={d}
                  type="button"
                  data-day={d}
                  className={`${styles.dayChip} ${i === index ? styles.dayChipActive : ""} ${
                    isDone(d) ? styles.dayChipDone : ""
                  }`}
                  aria-current={i === index ? "date" : undefined}
                  aria-label={dd.toLocaleDateString(locale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  onClick={() => goTo(i)}
                >
                  <small>{dd.toLocaleDateString(locale, { weekday: "narrow" })}</small>
                  {dd.getDate()}
                  <i aria-hidden>{isDone(d) ? "✓" : ""}</i>
                </button>
              );
            })}
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.dayNav}>
            <button
              type="button"
              className="btn btn-icon"
              aria-label={t("catchUp.prevDay")}
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              ‹
            </button>
            <div className={styles.dayTitle}>
              <strong>
                {date.toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </strong>
              <span className={styles.dayMeta}>
                {t("catchUp.dayOf", { n: index + 1, total: days.length })}
                {tag && <em className={styles.tag}>{tag}</em>}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-icon"
              aria-label={t("catchUp.nextDay")}
              disabled={isLast}
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>
          </div>

          {entries.length > 0 && (
            <ul className={styles.entries}>
              {entries.map((e) => {
                const cat = listFor(e.kind).find((c) => c.id === e.categoryId);
                return (
                  <li key={`${e.kind}:${e.id}`} className={styles.entry}>
                    <span aria-hidden>{cat?.icon ?? "•"}</span>
                    <span className={styles.entryName}>
                      {e.note || displayCategoryName(cat, lang)}
                      {e.recurringId && <em className={styles.auto}>{t("catchUp.auto")}</em>}
                    </span>
                    <span className={e.kind === "income" ? styles.income : undefined}>
                      {e.kind === "income" ? "+" : ""}
                      {formatMoney(e.amount, e.currency)}
                    </span>
                    {!e.recurringId && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        aria-label={t("catchUp.remove")}
                        onClick={() => onDelete(e)}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {dayNoSpend && manualCount === 0 && (
            <div className={styles.noSpendNote}>
              <span>{t("catchUp.markedNoSpend")}</span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onSetNoSpend(day, false)}
              >
                {t("catchUp.undo")}
              </button>
            </div>
          )}

          {favorites.length > 0 && (
            <div className={styles.favorites} role="group" aria-label={t("entryForm.quickAdd")}>
              {favorites.map((fav) => {
                const cat = listFor(fav.kind).find((c) => c.id === fav.categoryId);
                return (
                  <button
                    key={`${fav.kind}:${fav.categoryId}:${fav.amount}:${fav.currency}`}
                    type="button"
                    className={styles.favoriteChip}
                    onClick={() => applyFavorite(fav)}
                  >
                    <span aria-hidden>{cat?.icon ?? "•"}</span>
                    {formatMoney(fav.amount, fav.currency)}
                  </button>
                );
              })}
            </div>
          )}

          <div className={styles.kindToggle} role="group" aria-label={t("entryForm.entryType")}>
            {(["expense", "income"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`${styles.kindBtn} ${kind === k ? styles.kindActive : ""}`}
                aria-pressed={kind === k}
                onClick={() => switchKind(k)}
              >
                {t(k === "income" ? "kind.income" : "kind.expense")}
              </button>
            ))}
          </div>

          {/* Tiles instead of a <select>: a native picker per entry is the
              slowest part of logging a dozen things on a phone. */}
          <div className={styles.tiles} role="radiogroup" aria-label={t("field.category")}>
            {activeCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={categoryId === c.id}
                className={`${styles.tile} ${categoryId === c.id ? styles.tileActive : ""}`}
                style={{ "--cat": c.color } as CSSProperties}
                onClick={() => setCategoryId(c.id)}
              >
                <span aria-hidden className={styles.tileIcon}>
                  {c.icon ?? "•"}
                </span>
                <span className={styles.tileName}>{displayCategoryName(c, lang)}</span>
              </button>
            ))}
          </div>

          <div className={styles.amountRow}>
            <input
              ref={amountRef}
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              aria-label={t("field.amount")}
              placeholder={t("field.amount")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              enterKeyHint="done"
            />
            <select
              className="select"
              aria-label={t("field.currency")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
          <input
            className="input"
            type="text"
            aria-label={t("common.note")}
            placeholder={t("common.note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            enterKeyHint="done"
          />
        </div>

        <footer className={styles.footer}>
          {manualCount === 0 && !dayNoSpend ? (
            <button type="button" className="btn" onClick={markNoSpend}>
              {t("catchUp.noSpend")}
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-primary" disabled={!amountValid}>
            {t("common.add")}
          </button>
          {isLast ? (
            <button type="button" className="btn" onClick={onClose}>
              {t("catchUp.done")}
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => goTo(index + 1)}>
              {t("catchUp.next")} ›
            </button>
          )}
        </footer>
      </form>
    </>
  );
}
