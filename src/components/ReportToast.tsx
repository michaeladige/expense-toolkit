import type { Report } from "../types";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
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
  const { t } = useI18n();
  if (reports.length === 0) return null;

  const single = reports.length === 1 ? reports[0] : null;

  return (
    <div className={`card ${styles.toast}`} role="status">
      <span className={styles.message}>
        {single
          ? t("toast.single", {
              period: t(single.period === "week" ? "period.weekly" : "period.monthly"),
              label: single.label,
              net: `${single.approximate ? "≈" : ""}${single.net >= 0 ? "+" : ""}${formatMoney(single.net, single.baseCurrency)}`,
            })
          : t("toast.multiple", { n: reports.length })}
      </span>
      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={onView}>
          {t("toast.view")}
        </button>
        <button className="btn btn-ghost" onClick={onDismiss}>
          {t("toast.dismiss")}
        </button>
      </div>
    </div>
  );
}
