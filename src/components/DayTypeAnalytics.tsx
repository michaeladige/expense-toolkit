import type { DayType, DayTypeBreakdown } from "../lib/daytype";
import { DAY_TYPES, adviceLine, hasActivity, verdictLine } from "../lib/daytype";
import { formatMoney } from "../lib/currency";
import styles from "./DayTypeAnalytics.module.css";

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  workday: "Workdays",
  dayoff: "Days off",
};

export const DAY_TYPE_COLOR: Record<DayType, string> = {
  workday: "#3b82f6",
  dayoff: "#f59e0b",
};

interface Props {
  breakdown: DayTypeBreakdown;
  baseCurrency: string;
  onViewDetails: () => void;
}

export function DayTypeAnalytics({ breakdown, baseCurrency, onViewDetails }: Props) {
  const { stats, approximate } = breakdown;

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2>When you spend</h2>
        <span className={styles.sub}>All-time · avg = per day you spent</span>
      </div>

      {!hasActivity(breakdown) ? (
        <p className={styles.empty}>
          Log a few expenses and you'll see how your workdays and days off
          compare.
        </p>
      ) : (
        <>
          <ul className={styles.rows}>
            {DAY_TYPES.map((type) => {
              const s = stats[type];
              return (
                <li key={type} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.name}>
                      <span
                        className={styles.swatch}
                        style={{ background: DAY_TYPE_COLOR[type] }}
                      />
                      {DAY_TYPE_LABEL[type]}
                      {type === "dayoff" && approximate && (
                        <span
                          className={styles.approx}
                          title="Some expenses fall outside the years we have holiday data for, so a few holidays may be counted as workdays"
                        >
                          ~approx
                        </span>
                      )}
                    </span>
                    <span className={styles.total}>
                      {formatMoney(s.total, baseCurrency)}
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.round(s.share * 100)}%`,
                        background: DAY_TYPE_COLOR[type],
                      }}
                    />
                  </div>
                  <div className={styles.meta}>
                    <span>{formatMoney(s.average, baseCurrency)}/day</span>
                    <span>
                      {s.activeDays} day{s.activeDays === 1 ? "" : "s"} ·{" "}
                      {Math.round(s.share * 100)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className={styles.verdict}>{verdictLine(breakdown)}</p>
          <p className={styles.advice}>💡 {adviceLine(breakdown)}</p>

          <button
            type="button"
            className={`btn btn-ghost ${styles.viewAll}`}
            onClick={onViewDetails}
          >
            See the full breakdown →
          </button>
        </>
      )}
    </div>
  );
}
