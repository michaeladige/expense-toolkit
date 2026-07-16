import type { PeriodType } from "../types";
import { formatPeriodLabel, shiftPeriod } from "../lib/dates";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./PeriodSelector.module.css";

const PERIODS: PeriodType[] = ["day", "week", "month"];

interface Props {
  period: PeriodType;
  refDate: Date;
  onPeriodChange: (p: PeriodType) => void;
  onRefDateChange: (d: Date) => void;
}

export function PeriodSelector({
  period,
  refDate,
  onPeriodChange,
  onRefDateChange,
}: Props) {
  const { t, locale } = useI18n();
  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label={t("period.tablist")}>
        {PERIODS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={p === period}
            className={`${styles.tab} ${p === period ? styles.active : ""}`}
            onClick={() => onPeriodChange(p)}
          >
            {t(`period.${p}`)}
          </button>
        ))}
      </div>

      <div className={styles.nav}>
        <button
          className="btn btn-icon"
          aria-label={t("period.prev")}
          onClick={() => onRefDateChange(shiftPeriod(period, refDate, -1))}
        >
          ‹
        </button>
        <span className={styles.label}>
          {formatPeriodLabel(period, refDate, locale)}
        </span>
        <button
          className="btn btn-icon"
          aria-label={t("period.next")}
          onClick={() => onRefDateChange(shiftPeriod(period, refDate, 1))}
        >
          ›
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => onRefDateChange(new Date())}
        >
          {t("period.today")}
        </button>
      </div>
    </div>
  );
}
