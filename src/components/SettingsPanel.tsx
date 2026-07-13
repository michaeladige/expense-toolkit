import type { Category, Settings } from "../types";
import type { RateStatus } from "../hooks/useExchangeRates";
import { CURRENCIES } from "../lib/constants";
import { CategoryManager } from "./CategoryManager";
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
  onClose,
}: Props) {
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
          <h3 className={styles.subheading}>Categories</h3>
          <CategoryManager
            categories={categories}
            onAdd={onAddCategory}
            onUpdate={onUpdateCategory}
            onDelete={onDeleteCategory}
          />
        </section>
      </aside>
    </>
  );
}
