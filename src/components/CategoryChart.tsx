import { useState } from "react";
import type { Category } from "../types";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import { displayCategoryName } from "../lib/i18n/categoryName";
import styles from "./CategoryChart.module.css";

export interface CategorySlice {
  category: Category | undefined;
  amount: number;
}

interface Props {
  data: CategorySlice[];
  baseCurrency: string;
  /** Opens the drill-down for a category; slices/legend rows become clickable. */
  onSelectCategory?: (categoryId: string) => void;
}

const SIZE = 180;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // px surface gap between segments

export function CategoryChart({ data, baseCurrency, onSelectCategory }: Props) {
  const { t, lang } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  const select = (category: CategorySlice["category"]) => {
    if (onSelectCategory && category) onSelectCategory(category.id);
  };

  const slices = data
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = slices.reduce((s, d) => s + d.amount, 0);

  if (total <= 0) {
    return (
      <div className="card">
        <h2>{t("chart.byCategory")}</h2>
        <p className="empty">{t("chart.empty")}</p>
      </div>
    );
  }

  let offset = 0;
  const segments = slices.map((d, i) => {
    const frac = d.amount / total;
    const len = Math.max(frac * C - GAP, 0);
    const seg = {
      color: d.category?.color ?? "var(--text-muted)",
      dash: `${len} ${C - len}`,
      // rotate so the segment starts where the previous ended
      rotation: (offset / C) * 360 - 90,
      index: i,
    };
    offset += frac * C;
    return seg;
  });

  const focus = active != null ? slices[active] : null;

  return (
    <div className="card">
      <h2>{t("chart.byCategory")}</h2>
      <div className={styles.wrap}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.svg}
          role="img"
          aria-label={t("chart.spendingAria")}
        >
          {segments.map((s) => (
            <circle
              key={s.index}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={active === s.index ? STROKE + 4 : STROKE}
              strokeDasharray={s.dash}
              transform={`rotate(${s.rotation} ${SIZE / 2} ${SIZE / 2})`}
              className={styles.segment}
              onMouseEnter={() => setActive(s.index)}
              onMouseLeave={() => setActive(null)}
              onClick={() => select(slices[s.index].category)}
              style={onSelectCategory ? { cursor: "pointer" } : undefined}
            />
          ))}
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            className={styles.centerValue}
          >
            {formatMoney(focus ? focus.amount : total, baseCurrency)}
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            className={styles.centerLabel}
          >
            {focus ? displayCategoryName(focus.category, lang) : t("chart.total")}
          </text>
        </svg>

        <ul className={styles.legend}>
          {slices.map((d, i) => (
            <li
              key={d.category?.id ?? i}
              className={`${styles.legendItem} ${
                onSelectCategory && d.category ? styles.legendClickable : ""
              }`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => select(d.category)}
              role={onSelectCategory && d.category ? "button" : undefined}
              tabIndex={onSelectCategory && d.category ? 0 : undefined}
              onKeyDown={(e) => {
                if (onSelectCategory && d.category && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  select(d.category);
                }
              }}
            >
              <span
                className={styles.swatch}
                style={{ background: d.category?.color ?? "var(--text-muted)" }}
                aria-hidden
              />
              <span className={styles.legendName}>
                {displayCategoryName(d.category, lang)}
              </span>
              <span className={styles.legendPct}>
                {Math.round((d.amount / total) * 100)}%
              </span>
              <span className={styles.legendValue}>
                {formatMoney(d.amount, baseCurrency)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
