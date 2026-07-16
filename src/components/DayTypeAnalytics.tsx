import type { DayType, DayTypeBreakdown } from "../lib/daytype";
import { DAY_TYPES, adviceLine, hasActivity, verdictLine } from "../lib/daytype";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./DayTypeAnalytics.module.css";

/** i18n keys for each day type's label; translate at the render site. */
export const DAY_TYPE_LABEL: Record<DayType, string> = {
  workday: "dayType.workdays",
  dayoff: "dayType.daysOff",
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
  const { t, daytype } = useI18n();
  const { stats, approximate } = breakdown;

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2>{t("dayType.title")}</h2>
        <span className={styles.sub}>{t("dayType.subtitle")}</span>
      </div>

      {!hasActivity(breakdown) ? (
        <p className={styles.empty}>{t("dayType.empty")}</p>
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
                      {t(DAY_TYPE_LABEL[type])}
                      {type === "dayoff" && approximate && (
                        <span
                          className={styles.approx}
                          title={t("dayType.approxTitle")}
                        >
                          {t("dayType.approx")}
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
                    <span>{t("dayType.perDay", { money: formatMoney(s.average, baseCurrency) })}</span>
                    <span>
                      {t("dayType.days", {
                        n: s.activeDays,
                        pct: Math.round(s.share * 100),
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className={styles.verdict}>{verdictLine(breakdown, daytype)}</p>
          <p className={styles.advice}>💡 {adviceLine(breakdown, daytype)}</p>

          <button
            type="button"
            className={`btn btn-ghost ${styles.viewAll}`}
            onClick={onViewDetails}
          >
            {t("dayType.viewAll")}
          </button>
        </>
      )}
    </div>
  );
}
