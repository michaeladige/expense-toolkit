import { useState } from "react";
import type { PeriodType } from "../types";
import { formatMoney } from "../lib/currency";
import styles from "./TrendChart.module.css";

export interface TrendBucket {
  label: string;
  total: number;
  /** True for the period currently selected in the app. */
  current: boolean;
}

interface Props {
  buckets: TrendBucket[];
  baseCurrency: string;
  periodLabel: PeriodType;
}

const W = 320;
const H = 150;
const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const GAP = 2;

export function TrendChart({ buckets, baseCurrency, periodLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...buckets.map((b) => b.total), 1);
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const slot = W / buckets.length;
  const barW = Math.max(slot - GAP * 2, 2);

  const active = hover != null ? buckets[hover] : buckets[buckets.length - 1];

  return (
    <div className="card">
      <div className={styles.head}>
        <h2>Spending trend</h2>
        <span className={styles.headValue}>
          {active && (
            <>
              <span className="muted">{active.label}: </span>
              {formatMoney(active.total, baseCurrency)}
            </>
          )}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`Spending over the last ${buckets.length} ${periodLabel}s`}
      >
        {/* baseline */}
        <line
          x1={0}
          y1={H - PAD_BOTTOM}
          x2={W}
          y2={H - PAD_BOTTOM}
          className={styles.baseline}
        />
        {buckets.map((b, i) => {
          const h = (b.total / max) * plotH;
          const x = i * slot + GAP;
          const y = H - PAD_BOTTOM - h;
          const isActive = hover === i || (hover == null && b.current);
          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* invisible full-height hit target */}
              <rect
                x={i * slot}
                y={PAD_TOP}
                width={slot}
                height={plotH + PAD_BOTTOM - PAD_TOP}
                fill="transparent"
              />
              <rect
                x={x}
                y={b.total > 0 ? y : H - PAD_BOTTOM - 2}
                width={barW}
                height={b.total > 0 ? h : 2}
                rx={3}
                className={`${styles.bar} ${
                  b.current ? styles.barCurrent : ""
                } ${isActive ? styles.barActive : ""}`}
              />
              <text
                x={i * slot + slot / 2}
                y={H - PAD_BOTTOM + 14}
                textAnchor="middle"
                className={styles.axisLabel}
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
