import { useState } from "react";
import type {
  Budget,
  Category,
  Expense,
  Income,
  RecurringRule,
  Report,
  Settings,
} from "../types";
import type { BackupData } from "../lib/backup";
import type { RateStatus } from "../hooks/useExchangeRates";
import { CURRENCIES, OTHER_EXPENSE_ID, OTHER_INCOME_ID } from "../lib/constants";
import { permission, requestPermission, supported } from "../lib/notify";
import { appVersion } from "../lib/version";
import { CategoryManager } from "./CategoryManager";
import { DataControls } from "./DataControls";
import styles from "./SettingsPanel.module.css";

interface Props {
  settings: Settings;
  onUpdateSettings: (data: Partial<Settings>) => void;
  rateStatus: RateStatus;
  fetchedAt: string | null;
  onRefreshRates: () => void;
  categories: Category[];
  onAddCategory: (data: Omit<Category, "id">) => void;
  onUpdateCategory: (id: string, data: Partial<Omit<Category, "id">>) => void;
  onDeleteCategory: (id: string) => void;
  incomeCategories: Category[];
  onAddIncomeCategory: (data: Omit<Category, "id">) => void;
  onUpdateIncomeCategory: (id: string, data: Partial<Omit<Category, "id">>) => void;
  onDeleteIncomeCategory: (id: string) => void;
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  reports: Report[];
  recurring: RecurringRule[];
  categoryById: (id: string) => Category | undefined;
  incomeCategoryById: (id: string) => Category | undefined;
  onImportExpenses: (list: Omit<Expense, "id" | "createdAt">[]) => void;
  onImportIncomes: (list: Omit<Income, "id" | "createdAt">[]) => void;
  onClearAll: () => void;
  onRestoreAll: (data: BackupData) => void;
  onClose: () => void;
}

const RATE_TEXT: Record<RateStatus, string> = {
  idle: "Not loaded",
  loading: "Updating…",
  live: "Live rates",
  cached: "Cached rates (offline)",
  error: "Rates unavailable",
};

export function SettingsPanel({
  settings,
  onUpdateSettings,
  rateStatus,
  fetchedAt,
  onRefreshRates,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  incomeCategories,
  onAddIncomeCategory,
  onUpdateIncomeCategory,
  onDeleteIncomeCategory,
  expenses,
  incomes,
  budgets,
  reports,
  recurring,
  categoryById,
  incomeCategoryById,
  onImportExpenses,
  onImportIncomes,
  onClearAll,
  onRestoreAll,
  onClose,
}: Props) {
  const [perm, setPerm] = useState(permission);

  /** Permission must be requested from a user gesture — iOS Safari rejects it otherwise. */
  async function enableNotifications() {
    const result = await requestPermission();
    setPerm(result);
    onUpdateSettings({ notificationsEnabled: result === "granted" });
  }

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label="Settings"
        aria-modal="true"
      >
        <header className={styles.header}>
          <h2 className={styles.heading}>Settings</h2>
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Close settings"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <section className={styles.section}>
          <div className="field">
            <label htmlFor="base-currency">Base currency</label>
            <select
              id="base-currency"
              className="select"
              value={settings.baseCurrency}
              onChange={(e) =>
                onUpdateSettings({ baseCurrency: e.target.value })
              }
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <p className="muted" style={{ fontSize: "0.8rem" }}>
              Combined totals and budgets are shown in this currency.
            </p>
          </div>

          <div className={styles.rates}>
            <span>
              {RATE_TEXT[rateStatus]}
              {fetchedAt && (
                <span className="muted">
                  {" "}
                  · {new Date(fetchedAt).toLocaleString()}
                </span>
              )}
            </span>
            <button
              className="btn"
              onClick={onRefreshRates}
              disabled={rateStatus === "loading"}
            >
              Refresh
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>Reports</h3>
          <div className={styles.rates}>
            <span>
              {perm === "granted" && settings.notificationsEnabled
                ? "Notifications on"
                : perm === "denied"
                  ? "Notifications blocked in your browser"
                  : perm === "unsupported"
                    ? "Notifications unavailable here"
                    : "Notifications off"}
            </span>
            {perm === "granted" ? (
              <button
                className="btn"
                onClick={() =>
                  onUpdateSettings({
                    notificationsEnabled: !settings.notificationsEnabled,
                  })
                }
              >
                {settings.notificationsEnabled ? "Turn off" : "Turn on"}
              </button>
            ) : (
              <button
                className="btn"
                onClick={enableNotifications}
                disabled={perm !== "default"}
              >
                Enable
              </button>
            )}
          </div>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            A report is written for each week and month that finishes. Because
            everything runs in your browser with no server, reports are produced
            the next time you open the app rather than at the moment the period
            ends — nothing is ever skipped, it may just arrive late.
            {!supported() &&
              " Your browser doesn't offer notifications here; on iOS, add the app to your home screen first."}
          </p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>Expense categories</h3>
          <CategoryManager
            categories={categories}
            protectedId={OTHER_EXPENSE_ID}
            onAdd={onAddCategory}
            onUpdate={onUpdateCategory}
            onDelete={onDeleteCategory}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>Income categories</h3>
          <CategoryManager
            categories={incomeCategories}
            protectedId={OTHER_INCOME_ID}
            onAdd={onAddIncomeCategory}
            onUpdate={onUpdateIncomeCategory}
            onDelete={onDeleteIncomeCategory}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>Data</h3>
          <DataControls
            expenses={expenses}
            incomes={incomes}
            categories={categories}
            incomeCategories={incomeCategories}
            budgets={budgets}
            reports={reports}
            recurring={recurring}
            settings={settings}
            categoryById={categoryById}
            incomeCategoryById={incomeCategoryById}
            onImportExpenses={onImportExpenses}
            onImportIncomes={onImportIncomes}
            onClearAll={onClearAll}
            onRestoreAll={onRestoreAll}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>About</h3>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            Expense Toolkit · {appVersion}
          </p>
        </section>
      </aside>
    </>
  );
}
