import { useMemo, useState } from "react";
import type { Expense, PeriodType } from "./types";
import { useExpenses } from "./store/ExpenseContext";
import { useExchangeRates, type RateStatus } from "./hooks/useExchangeRates";
import { getRange, isWithinRange, formatPeriodLabel } from "./lib/dates";
import { sumByCategoryInBase } from "./lib/summary";
import { PeriodSelector } from "./components/PeriodSelector";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { SummaryCards } from "./components/SummaryCards";
import { CategoryChart } from "./components/CategoryChart";
import { BudgetPanel } from "./components/BudgetPanel";
import { SettingsPanel } from "./components/SettingsPanel";
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
            <CategoryChart
              data={categorySlices}
              baseCurrency={settings.baseCurrency}
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
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
