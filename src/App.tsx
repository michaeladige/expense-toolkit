import { useMemo, useState } from "react";
import type { Expense, PeriodType } from "./types";
import { useExpenses } from "./store/ExpenseContext";
import { useExchangeRates, type RateStatus } from "./hooks/useExchangeRates";
import {
  getRange,
  isWithinRange,
  formatPeriodLabel,
  getRecentPeriods,
  monthKey,
} from "./lib/dates";
import { sumByCategoryInBase, totalInBase, totalsByMonthInBase } from "./lib/summary";
import { gradeSpending } from "./lib/grade";
import { PeriodSelector } from "./components/PeriodSelector";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { SummaryCards } from "./components/SummaryCards";
import { CategoryChart } from "./components/CategoryChart";
import { TrendChart } from "./components/TrendChart";
import { SpendingGrade } from "./components/SpendingGrade";
import { BudgetPanel } from "./components/BudgetPanel";
import { SettingsPanel } from "./components/SettingsPanel";
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
  const [editing, setEditing] = useState<Expense | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Expenses within the currently selected period.
  const periodExpenses = useMemo(() => {
    const range = getRange(period, refDate);
    return store.expenses.filter((e) => isWithinRange(e.date, range));
  }, [store.expenses, period, refDate]);

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

  // Budgets always track the calendar month containing refDate.
  const monthData = useMemo(() => {
    const range = getRange("month", refDate);
    const monthExpenses = store.expenses.filter((e) =>
      isWithinRange(e.date, range)
    );
    const byCategory = sumByCategoryInBase(
      monthExpenses,
      settings.baseCurrency,
      rates
    );
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    return { byCategory, total };
  }, [store.expenses, refDate, settings.baseCurrency, rates]);

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

  function handleSubmit(data: Omit<Expense, "id" | "createdAt">) {
    if (editing) {
      store.updateExpense(editing.id, data);
      setEditing(null);
    } else {
      store.addExpense(data);
    }
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
          baseCurrency={settings.baseCurrency}
          rates={rates}
        />

        <div className={styles.columns}>
          <div className={styles.col}>
            <ExpenseForm
              categories={store.categories}
              defaultCurrency={settings.baseCurrency}
              editing={editing}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditing(null)}
            />
            <ExpenseList
              expenses={periodExpenses}
              categoryById={store.categoryById}
              baseCurrency={settings.baseCurrency}
              rates={rates}
              onEdit={setEditing}
              onDelete={store.deleteExpense}
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
            <SpendingGrade
              info={spendingGrade}
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
          expenses={store.expenses}
          categoryById={store.categoryById}
          onImport={store.importExpenses}
          onClearAll={store.clearAllData}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <UpdatePrompt />
    </div>
  );
}
