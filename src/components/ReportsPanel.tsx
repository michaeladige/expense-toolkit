import type { Report, ReportCategoryTotal } from "../types";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./ReportsPanel.module.css";

interface Props {
  reports: Report[];
  onClose: () => void;
}

/** Percentage change in net vs the previous period, or null when it can't be expressed. */
function changeVsPrev(report: Report): number | null {
  if (report.prevNet == null || report.prevNet === 0) return null;
  return ((report.net - report.prevNet) / Math.abs(report.prevNet)) * 100;
}

/** Names and colors come from the report itself — they're frozen at generation. */
function TopCategories({
  totals,
  currency,
}: {
  totals: ReportCategoryTotal[];
  currency: string;
}) {
  const rows = totals.slice(0, 3);
  if (rows.length === 0) return null;
  return (
    <ul className={styles.catList}>
      {rows.map((row) => (
        <li key={row.categoryId}>
          <span className={styles.catName}>
            <span className={styles.dot} style={{ background: row.color }} aria-hidden />
            {row.name}
          </span>
          <span className={styles.catValue}>
            {formatMoney(row.amount, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ReportsPanel({ reports, onClose }: Props) {
  const { t } = useI18n();
  // Newest first. periodKey sorts chronologically within a period type, but
  // weeks and months interleave, so order by the date the period ended. A month
  // ending on a Sunday ties with that week, so break ties with the longer period
  // first for a stable order across reloads.
  const sorted = [...reports].sort(
    (a, b) =>
      b.endDate.localeCompare(a.endDate) ||
      a.startDate.localeCompare(b.startDate)
  );

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label={t("reports.title")}
        aria-modal="true"
      >
        <header className={styles.header}>
          <h2 className={styles.heading}>{t("reports.title")}</h2>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={t("reports.closeAria")}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {sorted.length === 0 ? (
          <p className="empty">{t("reports.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {sorted.map((r) => {
              const change = changeVsPrev(r);
              return (
                <li key={r.id} className={styles.report}>
                  <div className={styles.reportHeader}>
                    <span className={styles.periodTag}>
                      {r.period === "week" ? t("reports.week") : t("reports.month")}
                    </span>
                    <span className={styles.label}>{r.label}</span>
                  </div>

                  <div className={styles.netRow}>
                    <strong
                      className={`${styles.net} ${r.net < 0 ? styles.negative : styles.positive}`}
                    >
                      {r.approximate && "≈ "}
                      {r.net >= 0 && "+"}
                      {formatMoney(r.net, r.baseCurrency)}
                    </strong>
                    {change != null && (
                      <span
                        className={`${styles.change} ${change >= 0 ? styles.positive : styles.negative}`}
                        title={t("reports.changeTitle")}
                      >
                        {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className={styles.flows}>
                    <span className={styles.positive}>
                      {t("reports.in", { amount: formatMoney(r.incomeTotal, r.baseCurrency) })}
                    </span>
                    <span className="muted">
                      {t("reports.out", { amount: formatMoney(r.expenseTotal, r.baseCurrency) })}
                    </span>
                  </div>

                  <TopCategories
                    totals={r.expenseByCategory}
                    currency={r.baseCurrency}
                  />
                  <TopCategories
                    totals={r.incomeByCategory}
                    currency={r.baseCurrency}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </>
  );
}
