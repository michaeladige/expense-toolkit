import type { Projection } from "../lib/forecast";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./ForecastCard.module.css";

export type ForecastPeriod = "month" | "week";

export interface ForecastRow {
  period: ForecastPeriod;
  projection: Projection;
  /** Baseline to compare the projection against; null when none is available. */
  target: number | null;
  /** Where the target came from — shown as a caption on the month row. */
  targetSource: "budget" | "average" | null;
}

interface Props {
  rows: ForecastRow[];
  baseCurrency: string;
}

const PERIOD_LABEL: Record<ForecastPeriod, string> = {
  month: "forecast.thisMonth",
  week: "forecast.thisWeek",
};

export function ForecastCard({ rows, baseCurrency }: Props) {
  const { t } = useI18n();

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2>{t("forecast.title")}</h2>
        <span className={styles.sub}>{t("forecast.subtitle")}</span>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>{t("forecast.empty")}</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <ForecastRowView key={row.period} row={row} baseCurrency={baseCurrency} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ForecastRowView({ row, baseCurrency }: { row: ForecastRow; baseCurrency: string }) {
  const { t } = useI18n();
  const { projection, target, targetSource, period } = row;
  const { spentSoFar, projected, elapsedDays, totalDays } = projection;

  const scale = Math.max(projected, target ?? 0, spentSoFar, 1);
  const spentPct = (spentSoFar / scale) * 100;
  const projectedPct = (projected / scale) * 100;
  const targetPct = target != null ? (target / scale) * 100 : null;

  // Pace: is the projected end-of-period total over or under the baseline?
  const over = target != null && projected > target * 1.02;
  const under = target != null && projected < target * 0.98;
  const paceClass = over ? styles.over : styles.under;

  let pace: string;
  if (target == null) {
    pace = t("forecast.projected", { amount: formatMoney(projected, baseCurrency) });
  } else if (over) {
    pace = t("forecast.over", { amount: formatMoney(projected - target, baseCurrency) });
  } else if (under) {
    pace = t("forecast.under", { amount: formatMoney(target - projected, baseCurrency) });
  } else {
    pace = t("forecast.onTrack");
  }

  return (
    <li className={styles.row}>
      <div className={styles.rowHead}>
        <span className={styles.name}>
          {t(PERIOD_LABEL[period])}
          {period === "week" && (
            <span className={styles.approx} title={t("forecast.weekApproxTitle")}>
              {t("forecast.approx")}
            </span>
          )}
        </span>
        <span className={styles.projected}>
          {formatMoney(projected, baseCurrency)}
        </span>
      </div>

      <div className={styles.track}>
        <span className={styles.spent} style={{ width: `${spentPct}%` }} />
        <span
          className={styles.ghost}
          style={{ left: `${spentPct}%`, width: `${Math.max(projectedPct - spentPct, 0)}%` }}
        />
        {targetPct != null && (
          <span className={styles.target} style={{ left: `${Math.min(targetPct, 100)}%` }} />
        )}
      </div>

      <div className={styles.meta}>
        <span className={target != null ? paceClass : undefined}>{pace}</span>
        <span>
          {t("forecast.spentSoFar", { amount: formatMoney(spentSoFar, baseCurrency) })}
          {" · "}
          {t("forecast.dayOf", { day: elapsedDays, total: totalDays })}
        </span>
      </div>

      {target != null && targetSource && (
        <div className={styles.targetNote}>
          {targetSource === "budget"
            ? t("forecast.vsBudget", { amount: formatMoney(target, baseCurrency) })
            : t("forecast.vsAverage", { amount: formatMoney(target, baseCurrency) })}
        </div>
      )}
    </li>
  );
}
