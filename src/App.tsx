import { useMemo, useState } from "react";
import type { EntryKind, Expense, PeriodType, TaggedEntry } from "./types";
import { useExpenses } from "./store/ExpenseContext";
import { useExchangeRates, type RateStatus } from "./hooks/useExchangeRates";
import { useAutoReports } from "./hooks/useAutoReports";
import { useRecurring } from "./hooks/useRecurring";
import {
  getRange,
  isWithinRange,
  formatPeriodLabel,
  getRecentPeriods,
  monthKey,
  todayISO,
} from "./lib/dates";
import { sumByCategoryInBase, totalInBase, totalsByMonthInBase } from "./lib/summary";
import { topFavorites } from "./lib/favorites";
import { gradeSavings, gradeSpending } from "./lib/grade";
import { PeriodSelector } from "./components/PeriodSelector";
import { EntryForm } from "./components/EntryForm";
import { EntryList } from "./components/EntryList";
import { SummaryCards } from "./components/SummaryCards";
import { CategoryChart } from "./components/CategoryChart";
import { TrendChart } from "./components/TrendChart";
import { MonthGrades } from "./components/MonthGrades";
import { BudgetPanel } from "./components/BudgetPanel";
import { RecurringPanel } from "./components/RecurringPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ReportsPanel } from "./components/ReportsPanel";
import { ReportToast } from "./components/ReportToast";
import { UpdatePrompt } from "./components/UpdatePrompt";
import styles from "./App.module.css";

const RATE_PILL: Record<RateStatus, { label: string; cls: string }> = {
  idle: { label: "Rates", cls: "" },
  loading: { label: "Updating…", cls: "" },
  live: { label: "Live rates", cls: "pill-live" },
  cached: { label: "Cached rates", cls: "pill-cached" },
  error: { label: "Rates offline", cls: "pill-error" },
};

export default function App() {
  const store = useExpenses();
  const { settings } = store;
  const { rates, status, fetchedAt, refresh } = useExchangeRates(
    settings.baseCurrency
  );

  const [period, setPeriod] = useState<PeriodType>("month");
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [editing, setEditing] = useState<TaggedEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const { fresh, dismissFresh } = useAutoReports({
    expenses: store.expenses,
    incomes: store.incomes,
    reports: store.reports,
    settings,
    rates,
    rateStatus: status,
    categoryById: store.categoryById,
    incomeCategoryById: store.incomeCategoryById,
    addReports: store.addReports,
    updateSettings: store.updateSettings,
  });

  useRecurring({
    recurring: store.recurring,
    applyRecurring: store.applyRecurring,
  });

  // Expenses within the currently selected period.
  const periodExpenses = useMemo(() => {
    const range = getRange(period, refDate);
    return store.expenses.filter((e) => isWithinRange(e.date, range));
  }, [store.expenses, period, refDate]);

  // Income within the currently selected period.
  const periodIncomes = useMemo(() => {
    const range = getRange(period, refDate);
    return store.incomes.filter((e) => isWithinRange(e.date, range));
  }, [store.incomes, period, refDate]);

  // The two sides merged into one list for the unified transaction view.
  const periodEntries = useMemo<TaggedEntry[]>(
    () => [
      ...periodExpenses.map((e) => ({ ...e, kind: "expense" as const })),
      ...periodIncomes.map((e) => ({ ...e, kind: "income" as const })),
    ],
    [periodExpenses, periodIncomes]
  );

  // Most frequent recent (kind, category, amount, currency) combos, for the
  // quick-add chips. Derived, not stored — needs no management UI.
  const favorites = useMemo(
    () => topFavorites(store.expenses, store.incomes),
    [store.expenses, store.incomes]
  );

  // Category slices for the chart (period-scoped, converted to base).
  const categorySlices = useMemo(() => {
    const totals = sumByCategoryInBase(
      periodExpenses,
      settings.baseCurrency,
      rates
    );
    return store.categories
      .map((category) => ({ category, amount: totals[category.id] ?? 0 }))
      .filter((s) => s.amount > 0);
  }, [periodExpenses, store.categories, settings.baseCurrency, rates]);

  // Budgets and grades always track the calendar month containing refDate.
  const monthData = useMemo(() => {
    const range = getRange("month", refDate);
    const monthExpenses = store.expenses.filter((e) =>
      isWithinRange(e.date, range)
    );
    const monthIncomes = store.incomes.filter((e) =>
      isWithinRange(e.date, range)
    );
    const byCategory = sumByCategoryInBase(
      monthExpenses,
      settings.baseCurrency,
      rates
    );
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const income = totalInBase(monthIncomes, settings.baseCurrency, rates).total;
    return { byCategory, total, income, net: income - total };
  }, [store.expenses, store.incomes, refDate, settings.baseCurrency, rates]);

  // Resolves the target for the spending grade: an explicit Overall budget
  // takes priority; otherwise falls back to the average total spend of prior
  // months (relative to the viewed month, not wall-clock "today") that have
  // at least one expense. Returns null when there's nothing to grade.
  const spendingGrade = useMemo(() => {
    const overallBudget = store.budgets.find((b) => b.categoryId === "all");

    let target: number | null = null;
    let targetSource: "budget" | "average" | null = null;

    if (overallBudget) {
      target = overallBudget.amount;
      targetSource = "budget";
    } else {
      const currentMonthKey = monthKey(refDate);
      const monthTotals = totalsByMonthInBase(
        store.expenses,
        settings.baseCurrency,
        rates
      );
      const priorTotals = Object.entries(monthTotals)
        .filter(([key]) => key < currentMonthKey)
        .map(([, total]) => total);
      if (priorTotals.length > 0) {
        target = priorTotals.reduce((s, v) => s + v, 0) / priorTotals.length;
        targetSource = "average";
      }
    }

    if (target == null || targetSource == null) return null;
    const grade = gradeSpending(monthData.total, target);
    return grade ? { grade, target, targetSource } : null;
  }, [store.budgets, store.expenses, refDate, settings.baseCurrency, rates, monthData.total]);

  // Scored separately from the spending grade, against income rather than a
  // target: you can hold a budget and still save nothing, and one number
  // couldn't say both. Null until some income exists to divide by.
  const savingsGrade = useMemo(() => {
    const grade = gradeSavings(monthData.net, monthData.income);
    return grade ? { grade, income: monthData.income, net: monthData.net } : null;
  }, [monthData.net, monthData.income]);

  // Spending totals for recent periods, for the trend chart.
  const trendBuckets = useMemo(() => {
    const counts: Record<PeriodType, number> = { day: 14, week: 8, month: 12 };
    const buckets = getRecentPeriods(period, refDate, counts[period]);
    const selected = getRange(period, refDate);
    return buckets.map((b) => {
      const inRange = store.expenses.filter((e) => isWithinRange(e.date, b));
      return {
        label: b.label,
        total: totalInBase(inRange, settings.baseCurrency, rates).total,
        current: b.start.getTime() === selected.start.getTime(),
      };
    });
  }, [store.expenses, period, refDate, settings.baseCurrency, rates]);

  function handleSubmit(kind: EntryKind, data: Omit<Expense, "id" | "createdAt">) {
    if (editing) {
      // The form locks `kind` while editing, so an entry always updates in place.
      if (editing.kind === "income") store.updateIncome(editing.id, data);
      else store.updateExpense(editing.id, data);
      setEditing(null);
    } else if (kind === "income") {
      store.addIncome(data);
    } else {
      store.addExpense(data);
    }
  }

  function handleDelete(entry: TaggedEntry) {
    if (entry.kind === "income") store.deleteIncome(entry.id);
    else store.deleteExpense(entry.id);
    if (editing?.kind === entry.kind && editing.id === entry.id) setEditing(null);
  }

  // Re-logs the same entry dated today — for repeat purchases like "coffee
  // again" — rather than copying it to its original date.
  function handleDuplicate(entry: TaggedEntry) {
    const draft = {
      amount: entry.amount,
      currency: entry.currency,
      categoryId: entry.categoryId,
      date: todayISO(),
      note: entry.note,
    };
    if (entry.kind === "income") store.addIncome(draft);
    else store.addExpense(draft);
  }

  const pill = RATE_PILL[status];

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo}>💸</span>
          <div>
            <h1 className={styles.title}>Expense Toolkit</h1>
            <span className={styles.tagline}>
              Track spending across day, week &amp; month
            </span>
          </div>
        </div>
        <div className={styles.topActions}>
          <button
            className={`pill ${pill.cls}`}
            onClick={refresh}
            title="Exchange-rate status — click to refresh"
          >
            <span className="dot" />
            {pill.label}
          </button>
          <button className="btn" onClick={() => setReportsOpen(true)}>
            📊 Reports
            {store.reports.length > 0 && ` (${store.reports.length})`}
          </button>
          <button className="btn" onClick={() => setSettingsOpen(true)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={`card ${styles.periodCard}`}>
          <PeriodSelector
            period={period}
            refDate={refDate}
            onPeriodChange={setPeriod}
            onRefDateChange={setRefDate}
          />
        </div>

        <SummaryCards
          expenses={periodExpenses}
          incomes={periodIncomes}
          baseCurrency={settings.baseCurrency}
          rates={rates}
        />

        <div className={styles.columns}>
          <div className={styles.col}>
            <EntryForm
              categories={store.categories}
              incomeCategories={store.incomeCategories}
              defaultCurrency={settings.baseCurrency}
              editing={editing}
              favorites={favorites}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditing(null)}
            />
            <EntryList
              entries={periodEntries}
              categoryById={store.categoryById}
              incomeCategoryById={store.incomeCategoryById}
              baseCurrency={settings.baseCurrency}
              rates={rates}
              onEdit={setEditing}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          </div>

          <div className={styles.col}>
            <TrendChart
              buckets={trendBuckets}
              baseCurrency={settings.baseCurrency}
              periodLabel={period}
            />
            <CategoryChart
              data={categorySlices}
              baseCurrency={settings.baseCurrency}
            />
            <MonthGrades
              spending={spendingGrade}
              savings={savingsGrade}
              monthTotal={monthData.total}
              baseCurrency={settings.baseCurrency}
              monthLabel={formatPeriodLabel("month", refDate)}
            />
            <BudgetPanel
              categories={store.categories}
              budgets={store.budgets}
              monthSpentByCategory={monthData.byCategory}
              monthTotal={monthData.total}
              baseCurrency={settings.baseCurrency}
              monthLabel={formatPeriodLabel("month", refDate)}
              onSetBudget={store.setBudget}
              onRemoveBudget={store.removeBudget}
            />
            <RecurringPanel
              categories={store.categories}
              incomeCategories={store.incomeCategories}
              recurring={store.recurring}
              onAdd={store.addRecurring}
              onUpdate={store.updateRecurring}
              onDelete={store.deleteRecurring}
            />
          </div>
        </div>
      </main>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={store.updateSettings}
          rateStatus={status}
          fetchedAt={fetchedAt}
          onRefreshRates={refresh}
          categories={store.categories}
          onAddCategory={store.addCategory}
          onUpdateCategory={store.updateCategory}
          onDeleteCategory={store.deleteCategory}
          incomeCategories={store.incomeCategories}
          onAddIncomeCategory={store.addIncomeCategory}
          onUpdateIncomeCategory={store.updateIncomeCategory}
          onDeleteIncomeCategory={store.deleteIncomeCategory}
          expenses={store.expenses}
          incomes={store.incomes}
          budgets={store.budgets}
          reports={store.reports}
          recurring={store.recurring}
          categoryById={store.categoryById}
          incomeCategoryById={store.incomeCategoryById}
          onImportExpenses={store.importExpenses}
          onImportIncomes={store.importIncomes}
          onClearAll={store.clearAllData}
          onRestoreAll={store.restoreAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {reportsOpen && (
        <ReportsPanel
          reports={store.reports}
          onClose={() => setReportsOpen(false)}
        />
      )}

      <div className="toast-stack">
        <ReportToast
          reports={fresh}
          onView={() => {
            dismissFresh();
            setReportsOpen(true);
          }}
          onDismiss={dismissFresh}
        />
        <UpdatePrompt />
      </div>
    </div>
  );
}
