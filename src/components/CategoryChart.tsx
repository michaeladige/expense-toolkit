import { useState } from "react";
import type { Category } from "../types";
import { formatMoney } from "../lib/currency";
import styles from "./CategoryChart.module.css";

export interface CategorySlice {
  category: Category | undefined;
  amount: number;
}

interface Props {
  data: CategorySlice[];
  baseCurrency: string;
}

const SIZE = 180;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // px surface gap between segments

export function CategoryChart({ data, baseCurrency }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const slices = data
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const total = slices.reduce((s, d) => s + d.amount, 0);

  if (total <= 0) {
    return (
      <div className="card">
        <h2>By category</h2>
        <p className="empty">No spending to chart in this period.</p>
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
      <h2>By category</h2>
      <div className={styles.wrap}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.svg}
          role="img"
          aria-label="Spending by category"
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
            {focus ? focus.category?.name ?? "Uncategorized" : "Total"}
          </text>
        </svg>

        <ul className={styles.legend}>
          {slices.map((d, i) => (
            <li
              key={d.category?.id ?? i}
              className={styles.legendItem}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <span
                className={styles.swatch}
                style={{ background: d.category?.color ?? "var(--text-muted)" }}
                aria-hidden
              />
              <span className={styles.legendName}>
                {d.category?.name ?? "Uncategorized"}
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
