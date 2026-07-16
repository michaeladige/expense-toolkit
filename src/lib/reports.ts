import type {
  Category,
  Entry,
  Expense,
  Income,
  RateMap,
  Report,
  ReportCategoryTotal,
  ReportPeriod,
} from "../types";
import {
  formatPeriodLabel,
  getRange,
  isWithinRange,
  periodKey,
  shiftPeriod,
  toISODate,
} from "./dates";
import { netInBase, sumByCategoryInBase } from "./summary";
import type { Language } from "./i18n/types";
import { displayCategoryName } from "./i18n/categoryName";
import { LOCALES, translate } from "./i18n/translate";

/**
 * Most periods generated in a single pass. Without a cap, a first run over
 * years of history — or a return after a long absence — would produce a flood
 * of reports and notifications.
 */
const BACKFILL_CAP = 12;

/** A report's id is derived from its period, so generating twice can't duplicate. */
export function reportId(period: ReportPeriod, key: string): string {
  return `${period}:${key}`;
}

function entriesInRange<T extends Entry>(entries: T[], ref: Date, period: ReportPeriod): T[] {
  const range = getRange(period, ref);
  return entries.filter((e) => isWithinRange(e.date, range));
}

/**
 * Reference dates for completed periods that still need a report: newer than
 * the `since` watermark, not already reported, and capped. Oldest first, so
 * generating in order lets each report see the previous one's net.
 */
export function pendingReportPeriods(
  period: ReportPeriod,
  reports: Report[],
  since: string,
  now: Date,
  cap: number = BACKFILL_CAP
): Date[] {
  const have = new Set(
    reports.filter((r) => r.period === period).map((r) => r.periodKey)
  );
  const out: Date[] = [];

  // Walk back from the *start* of the current period rather than from `now`:
  // shifting a month back from e.g. the 31st would land on the same month.
  let cursor = shiftPeriod(period, getRange(period, now).start, -1);
  for (let i = 0; i < cap; i++) {
    const { end } = getRange(period, cursor);
    // Periods ending at or before the watermark are the user's pre-existing
    // history, which we never report on retroactively.
    if (toISODate(end) <= since) break;
    if (!have.has(periodKey(period, cursor))) out.push(new Date(cursor));
    cursor = shiftPeriod(period, cursor, -1);
  }

  return out.reverse();
}

type CategoryLookup = (id: string) => Category | undefined;

/** Resolve per-category totals into a frozen, display-ready, descending list.
 *  Names are frozen in the language active at generation time. */
function freezeCategories(
  entries: Entry[],
  base: string,
  rates: RateMap,
  lookup: CategoryLookup,
  lang: Language
): ReportCategoryTotal[] {
  const totals = sumByCategoryInBase(entries, base, rates);
  return Object.entries(totals)
    .map(([categoryId, amount]) => {
      const cat = lookup(categoryId);
      return {
        categoryId,
        name: cat
          ? displayCategoryName(cat, lang)
          : translate(lang, "common.uncategorized"),
        color: cat?.color ?? "#64748b",
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface BuildReportArgs {
  period: ReportPeriod;
  ref: Date;
  expenses: Expense[];
  incomes: Income[];
  categoryById: CategoryLookup;
  incomeCategoryById: CategoryLookup;
  baseCurrency: string;
  rates: RateMap;
  prevNet: number | null;
  /** UI language at generation; the label and category names are frozen in it. */
  lang: Language;
}

/**
 * Snapshot one completed period, or null when it had no activity at all — a
 * week you recorded nothing in isn't worth a report or a notification.
 *
 * Everything shown later is frozen here rather than recomputed on view, so
 * neither FX-rate movement nor renaming a category changes a past report.
 */
export function buildReport({
  period,
  ref,
  expenses,
  incomes,
  categoryById,
  incomeCategoryById,
  baseCurrency,
  rates,
  prevNet,
  lang,
}: BuildReportArgs): Report | null {
  const periodExpenses = entriesInRange(expenses, ref, period);
  const periodIncomes = entriesInRange(incomes, ref, period);
  if (periodExpenses.length === 0 && periodIncomes.length === 0) return null;

  const range = getRange(period, ref);
  const totals = netInBase(periodIncomes, periodExpenses, baseCurrency, rates);
  const key = periodKey(period, ref);

  return {
    id: reportId(period, key),
    period,
    periodKey: key,
    startDate: toISODate(range.start),
    endDate: toISODate(range.end),
    label: formatPeriodLabel(period, ref, LOCALES[lang]),
    baseCurrency,
    incomeTotal: totals.income,
    expenseTotal: totals.expense,
    net: totals.net,
    incomeByCategory: freezeCategories(
      periodIncomes,
      baseCurrency,
      rates,
      incomeCategoryById,
      lang
    ),
    expenseByCategory: freezeCategories(
      periodExpenses,
      baseCurrency,
      rates,
      categoryById,
      lang
    ),
    prevNet,
    approximate: totals.missing,
    generatedAt: new Date().toISOString(),
  };
}

/** Net of the period immediately before `ref`, or null if it has no report. */
export function previousNet(
  period: ReportPeriod,
  ref: Date,
  reports: Report[]
): number | null {
  const key = periodKey(period, shiftPeriod(period, getRange(period, ref).start, -1));
  return reports.find((r) => r.period === period && r.periodKey === key)?.net ?? null;
}
