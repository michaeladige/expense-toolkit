import type { DayType, DayTypeBreakdown } from "../lib/daytype";
import { DAY_TYPES, adviceLine, hasActivity, verdictLine } from "../lib/daytype";
import { formatMoney } from "../lib/currency";
import styles from "./DayTypeAnalytics.module.css";

const LABEL: Record<DayType, string> = {
  weekday: "Weekdays",
  weekend: "Weekends",
  holiday: "Holidays",
};

const BAR_COLOR: Record<DayType, string> = {
  weekday: "#3b82f6",
  weekend: "#f59e0b",
  holiday: "#ec4899",
};

interface Props {
  breakdown: DayTypeBreakdown;
  baseCurrency: string;
}

export function DayTypeAnalytics({ breakdown, baseCurrency }: Props) {
  const { stats, holidaysKnown, approximate } = breakdown;

  // Holiday row only appears when a country is configured; without one it is
  // always empty and would read as a bug.
  const rows = DAY_TYPES.filter((t) => t !== "holiday" || holidaysKnown);

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2>When you spend</h2>
        <span className={styles.sub}>All-time · avg = per day you spent</span>
      </div>

      {!hasActivity(breakdown) ? (
        <p className={styles.empty}>
          Log a few expenses and you'll see how weekdays, weekends, and holidays
          compare.
        </p>
      ) : (
        <>
          <ul className={styles.rows}>
            {rows.map((type) => {
              const s = stats[type];
              return (
                <li key={type} className={styles.row}>
                  <div className={styles.rowHead}>
                    <span className={styles.name}>
                      <span
                        className={styles.swatch}
                        style={{ background: BAR_COLOR[type] }}
                      />
                      {LABEL[type]}
                      {type === "holiday" && approximate && (
                        <span className={styles.approx} title="Some expenses fall outside the years we have holiday data for">
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
                        background: BAR_COLOR[type],
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

          {!holidaysKnown && (
            <p className={styles.hint}>
              Set a holiday country in Settings to split out holiday spending.
            </p>
          )}

          <p className={styles.verdict}>{verdictLine(breakdown)}</p>
          <p className={styles.advice}>💡 {adviceLine(breakdown)}</p>
        </>
      )}
    </div>
  );
}
