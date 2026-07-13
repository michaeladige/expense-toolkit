import type { PeriodType } from "../types";
import { formatPeriodLabel, shiftPeriod } from "../lib/dates";
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
  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label="Period">
        {PERIODS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={p === period}
            className={`${styles.tab} ${p === period ? styles.active : ""}`}
            onClick={() => onPeriodChange(p)}
          >
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.nav}>
        <button
          className="btn btn-icon"
          aria-label="Previous period"
          onClick={() => onRefDateChange(shiftPeriod(period, refDate, -1))}
        >
          ‹
        </button>
        <span className={styles.label}>
          {formatPeriodLabel(period, refDate)}
        </span>
        <button
          className="btn btn-icon"
          aria-label="Next period"
          onClick={() => onRefDateChange(shiftPeriod(period, refDate, 1))}
        >
          ›
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => onRefDateChange(new Date())}
        >
          Today
        </button>
      </div>
    </div>
  );
}
