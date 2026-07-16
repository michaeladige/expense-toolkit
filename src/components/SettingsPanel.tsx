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
import type { CountryOption, HolidayStatus } from "../hooks/useHolidays";
import { CURRENCIES, OTHER_EXPENSE_ID, OTHER_INCOME_ID } from "../lib/constants";
import { permission, requestPermission, supported } from "../lib/notify";
import { appVersion } from "../lib/version";
import { useI18n } from "../lib/i18n/I18nContext";
import { AppearancePanel } from "./AppearancePanel";
import { CategoryManager } from "./CategoryManager";
import { DataControls } from "./DataControls";
import styles from "./SettingsPanel.module.css";

interface Props {
  settings: Settings;
  onUpdateSettings: (data: Partial<Settings>) => void;
  rateStatus: RateStatus;
  fetchedAt: string | null;
  onRefreshRates: () => void;
  countries: CountryOption[];
  holidayRegions: string[];
  holidayStatus: HolidayStatus;
  holidayFetchedAt: string | null;
  onRefreshHolidays: () => void;
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
  idle: "rate.status.idle",
  loading: "rate.status.loading",
  live: "rate.status.live",
  cached: "rate.status.cached",
  error: "rate.status.error",
};

const HOLIDAY_TEXT: Record<HolidayStatus, string> = {
  off: "holiday.status.off",
  idle: "holiday.status.idle",
  loading: "holiday.status.loading",
  live: "holiday.status.live",
  cached: "holiday.status.cached",
  error: "holiday.status.error",
};

export function SettingsPanel({
  settings,
  onUpdateSettings,
  rateStatus,
  fetchedAt,
  onRefreshRates,
  countries,
  holidayRegions,
  holidayStatus,
  holidayFetchedAt,
  onRefreshHolidays,
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
  const { t, locale } = useI18n();
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
        aria-label={t("settings.title")}
        aria-modal="true"
      >
        <header className={styles.header}>
          <h2 className={styles.heading}>{t("settings.title")}</h2>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={t("settings.closeAria")}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <section className={styles.section}>
          <div className="field">
            <label htmlFor="base-currency">{t("settings.baseCurrency")}</label>
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
              {t("settings.baseCurrencyHelp")}
            </p>
          </div>

          <div className={styles.rates}>
            <span>
              {t(RATE_TEXT[rateStatus])}
              {fetchedAt && (
                <span className="muted">
                  {" "}
                  · {new Date(fetchedAt).toLocaleString(locale)}
                </span>
              )}
            </span>
            <button
              className="btn"
              onClick={onRefreshRates}
              disabled={rateStatus === "loading"}
            >
              {t("settings.refresh")}
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>{t("settings.appearance")}</h3>
          <AppearancePanel
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>{t("settings.reports")}</h3>
          <div className={styles.rates}>
            <span>
              {perm === "granted" && settings.notificationsEnabled
                ? t("settings.notifOn")
                : perm === "denied"
                  ? t("settings.notifBlocked")
                  : perm === "unsupported"
                    ? t("settings.notifUnsupported")
                    : t("settings.notifOff")}
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
                {settings.notificationsEnabled ? t("settings.turnOff") : t("settings.turnOn")}
              </button>
            ) : (
              <button
                className="btn"
                onClick={enableNotifications}
                disabled={perm !== "default"}
              >
                {t("settings.enable")}
              </button>
            )}
          </div>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            {t("settings.reportsHelp")}
            {!supported() && t("settings.reportsHelpIos")}
          </p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>{t("settings.holidays")}</h3>
          <div className="field">
            <label htmlFor="holiday-country">{t("settings.holidayCalendar")}</label>
            <select
              id="holiday-country"
              className="select"
              value={settings.holidayCountry ?? ""}
              onChange={(e) =>
                onUpdateSettings({
                  holidayCountry: e.target.value || undefined,
                  // The old region belongs to the old country's code space.
                  holidayRegion: undefined,
                })
              }
            >
              <option value="">{t("settings.holidayNone")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {holidayRegions.length > 0 && (
            <div className="field">
              <label htmlFor="holiday-region">{t("settings.region")}</label>
              <select
                id="holiday-region"
                className="select"
                value={settings.holidayRegion ?? ""}
                onChange={(e) =>
                  onUpdateSettings({ holidayRegion: e.target.value || undefined })
                }
              >
                <option value="">{t("settings.regionNone")}</option>
                {holidayRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.holidayCountry && (
            <div className={styles.rates}>
              <span>
                {t(HOLIDAY_TEXT[holidayStatus])}
                {holidayFetchedAt && (
                  <span className="muted">
                    {" "}
                    · {new Date(holidayFetchedAt).toLocaleString(locale)}
                  </span>
                )}
              </span>
              <button
                className="btn"
                onClick={onRefreshHolidays}
                disabled={holidayStatus === "loading"}
              >
                {t("settings.refresh")}
              </button>
            </div>
          )}

          <p className="muted" style={{ fontSize: "0.8rem" }}>
            {t("settings.holidayHelp")}
          </p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>{t("settings.expenseCategories")}</h3>
          <CategoryManager
            categories={categories}
            protectedId={OTHER_EXPENSE_ID}
            onAdd={onAddCategory}
            onUpdate={onUpdateCategory}
            onDelete={onDeleteCategory}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>{t("settings.incomeCategories")}</h3>
          <CategoryManager
            categories={incomeCategories}
            protectedId={OTHER_INCOME_ID}
            onAdd={onAddIncomeCategory}
            onUpdate={onUpdateIncomeCategory}
            onDelete={onDeleteIncomeCategory}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.subheading}>{t("settings.data")}</h3>
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
          <h3 className={styles.subheading}>{t("settings.about")}</h3>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            {t("settings.aboutLine", { version: appVersion })}
          </p>
        </section>
      </aside>
    </>
  );
}
