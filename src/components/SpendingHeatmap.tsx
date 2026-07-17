import type { HeatmapGrid } from "../lib/heatmap";
import { HEATMAP_LEVELS } from "../lib/heatmap";
import { fromISODate } from "../lib/dates";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./SpendingHeatmap.module.css";

interface Props {
  grid: HeatmapGrid;
  baseCurrency: string;
}

const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 30; // room for weekday labels
const TOP = 16; // room for month labels
/** Weekday rows to label (0 = Monday … 6 = Sunday). */
const LABEL_ROWS = [0, 2, 4];

const LEVEL_CLASS = [
  styles.level0,
  styles.level1,
  styles.level2,
  styles.level3,
  styles.level4,
];

export function SpendingHeatmap({ grid, baseCurrency }: Props) {
  const { t, locale } = useI18n();
  const { weeks, maxTotal } = grid;

  if (maxTotal <= 0) {
    return (
      <div className="card">
        <h2>{t("heatmap.title")}</h2>
        <p className="empty">{t("heatmap.empty")}</p>
      </div>
    );
  }

  const width = LEFT + weeks.length * STEP;
  const height = TOP + 7 * STEP;

  // Weekday labels, derived from the first column's Monday so they stay
  // language-correct without static keys.
  const firstMonday = weeks[0].weekStart;
  const weekdayLabel = (row: number) => {
    const d = new Date(firstMonday);
    d.setDate(firstMonday.getDate() + row);
    return d.toLocaleDateString(locale, { weekday: "short" });
  };

  // A month label sits above the first column that begins a new month.
  let lastMonth = -1;

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2>{t("heatmap.title")}</h2>
        <span className={styles.sub}>{t("heatmap.subtitle")}</span>
      </div>

      <div className={styles.scroll}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={t("heatmap.aria")}
          className={styles.svg}
        >
          {LABEL_ROWS.map((row) => (
            <text
              key={`wd-${row}`}
              x={LEFT - 6}
              y={TOP + row * STEP + CELL - 2}
              textAnchor="end"
              className={styles.axis}
            >
              {weekdayLabel(row)}
            </text>
          ))}

          {weeks.map((week, col) => {
            const month = week.weekStart.getMonth();
            let monthText: string | null = null;
            if (month !== lastMonth) {
              lastMonth = month;
              monthText = week.weekStart.toLocaleDateString(locale, { month: "short" });
            }
            return (
              <g key={col}>
                {monthText && (
                  <text
                    x={LEFT + col * STEP}
                    y={TOP - 5}
                    className={styles.axis}
                  >
                    {monthText}
                  </text>
                )}
                {week.days.map((cell, row) => (
                  <rect
                    key={cell.date}
                    x={LEFT + col * STEP}
                    y={TOP + row * STEP}
                    width={CELL}
                    height={CELL}
                    rx={3}
                    className={`${styles.cell} ${LEVEL_CLASS[cell.level]} ${
                      cell.future ? styles.future : ""
                    }`}
                  >
                    {!cell.future && (
                      <title>
                        {`${fromISODate(cell.date).toLocaleDateString(locale, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}: ${formatMoney(cell.total, baseCurrency)}`}
                      </title>
                    )}
                  </rect>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.legend}>
        <span>{t("heatmap.less")}</span>
        {Array.from({ length: HEATMAP_LEVELS + 1 }, (_, level) => (
          <span key={level} className={`${styles.swatch} ${LEVEL_CLASS[level]}`} aria-hidden />
        ))}
        <span>{t("heatmap.more")}</span>
      </div>
    </div>
  );
}
