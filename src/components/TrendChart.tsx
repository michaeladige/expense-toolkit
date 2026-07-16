import { useMemo, useState } from "react";
import type { Category, PeriodType } from "../types";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import { displayCategoryName } from "../lib/i18n/categoryName";
import styles from "./TrendChart.module.css";

export interface TrendBucket {
  label: string;
  total: number;
  /** Spend in this bucket by category id, in base currency. */
  byCategory: Record<string, number>;
  /** True for the period currently selected in the app. */
  current: boolean;
}

interface Props {
  buckets: TrendBucket[];
  categories: Category[];
  baseCurrency: string;
  periodLabel: PeriodType;
}

const W = 320;
const H = 150;
const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const GAP = 2;

export function TrendChart({ buckets, categories, baseCurrency, periodLabel }: Props) {
  const { t, lang } = useI18n();
  const [hover, setHover] = useState<number | null>(null);

  // Stacking order: categories with the most spend across the visible
  // buckets first, same idea as the pie chart's largest-slice-first sort, so
  // colors line up consistently bar to bar.
  const orderedCategories = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const b of buckets) {
      for (const [id, amount] of Object.entries(b.byCategory)) {
        totals[id] = (totals[id] ?? 0) + amount;
      }
    }
    return categories
      .filter((c) => (totals[c.id] ?? 0) > 0)
      .sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  }, [buckets, categories]);

  const max = Math.max(...buckets.map((b) => b.total), 1);
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const slot = W / buckets.length;
  const barW = Math.max(slot - GAP * 2, 2);

  const active = hover != null ? buckets[hover] : buckets[buckets.length - 1];

  return (
    <div className="card">
      <div className={styles.head}>
        <h2>{t("trend.title")}</h2>
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
        aria-label={t("trend.aria", {
          n: buckets.length,
          unit: t(`unit.plural.${periodLabel}`),
        })}
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
          const x = i * slot + GAP;
          const isActive = hover === i || (hover == null && b.current);

          let cursorY = H - PAD_BOTTOM;
          const segments = orderedCategories
            .map((cat) => {
              const amount = b.byCategory[cat.id] ?? 0;
              if (amount <= 0) return null;
              const h = (amount / max) * plotH;
              const y = cursorY - h;
              cursorY = y;
              return {
                id: cat.id,
                name: displayCategoryName(cat, lang),
                color: cat.color,
                y,
                h,
                amount,
              };
            })
            .filter((s): s is NonNullable<typeof s> => s != null);

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
              {b.total > 0 ? (
                segments.map((s) => (
                  <rect
                    key={s.id}
                    x={x}
                    y={s.y}
                    width={barW}
                    height={s.h}
                    className={`${styles.segment} ${isActive ? styles.segmentActive : ""}`}
                    fill={s.color}
                  >
                    <title>
                      {s.name}: {formatMoney(s.amount, baseCurrency)}
                    </title>
                  </rect>
                ))
              ) : (
                <rect
                  x={x}
                  y={H - PAD_BOTTOM - 2}
                  width={barW}
                  height={2}
                  rx={1}
                  className={styles.empty}
                />
              )}
              {b.current && (
                <rect
                  x={x - 1}
                  y={H - PAD_BOTTOM - Math.max((b.total / max) * plotH, 2) - 1}
                  width={barW + 2}
                  height={Math.max((b.total / max) * plotH, 2) + 2}
                  rx={3}
                  className={styles.currentOutline}
                />
              )}
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

      {orderedCategories.length > 0 && (
        <ul className={styles.legend}>
          {orderedCategories.map((c) => (
            <li key={c.id} className={styles.legendItem}>
              <span
                className={styles.swatch}
                style={{ background: c.color }}
                aria-hidden
              />
              {displayCategoryName(c, lang)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
