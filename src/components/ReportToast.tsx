import type { Report } from "../types";
import { formatMoney } from "../lib/currency";
import styles from "./ReportToast.module.css";

interface Props {
  reports: Report[];
  onView: () => void;
  onDismiss: () => void;
}

/**
 * In-app announcement for freshly generated reports. Always shown, so the user
 * still learns about a report when notifications are off, denied, or — as on
 * iOS outside an installed PWA — unavailable entirely.
 */
export function ReportToast({ reports, onView, onDismiss }: Props) {
  if (reports.length === 0) return null;

  const single = reports.length === 1 ? reports[0] : null;

  return (
    <div className={`card ${styles.toast}`} role="status">
      <span className={styles.message}>
        {single ? (
          <>
            Your {single.period === "week" ? "weekly" : "monthly"} report for{" "}
            <strong>{single.label}</strong> is ready —{" "}
            {single.approximate && "≈"}
            {single.net >= 0 && "+"}
            {formatMoney(single.net, single.baseCurrency)} net.
          </>
        ) : (
          <>
            <strong>{reports.length} new reports</strong> are ready.
          </>
        )}
      </span>
      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={onView}>
          View
        </button>
        <button className="btn btn-ghost" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
