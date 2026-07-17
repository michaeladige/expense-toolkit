import type { Category } from "../types";
import type { EntryStats } from "../lib/summary";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import { displayCategoryName } from "../lib/i18n/categoryName";
import styles from "./CategoryDetailsPanel.module.css";

export interface CategoryTrendPoint {
  label: string;
  total: number;
}

export interface CategoryNoteTotal {
  note: string;
  total: number;
  count: number;
}

/** Everything the drill-down shows, computed by the parent for one category. */
export interface CategoryDetail {
  category: Category | undefined;
  stats: EntryStats;
  /** Category's share of the period's total spend (0–1). */
  share: number;
  /** This category's total across recent periods, oldest first. */
  trend: CategoryTrendPoint[];
  /** Notes on this category's entries, grouped and ranked by total. */
  topNotes: CategoryNoteTotal[];
}

interface Props {
  detail: CategoryDetail;
  baseCurrency: string;
  periodLabel: string;
  onClose: () => void;
}

/** How many notes to list. */
const TOP_NOTES = 6;

export function CategoryDetailsPanel({
  detail,
  baseCurrency,
  periodLabel,
  onClose,
}: Props) {
  const { t, lang } = useI18n();
  const { category, stats, share, trend, topNotes } = detail;
  const color = category?.color ?? "var(--text-muted)";
  const trendMax = Math.max(1, ...trend.map((p) => p.total));

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label={displayCategoryName(category, lang)}
        aria-modal="true"
      >
        <header className={styles.header}>
          <div className={styles.title}>
            <span className={styles.swatch} style={{ background: color }} aria-hidden />
            <div>
              <h2 className={styles.heading}>
                {category?.icon && <span aria-hidden>{category.icon} </span>}
                {displayCategoryName(category, lang)}
              </h2>
              <span className={styles.subheading}>{periodLabel}</span>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={t("category.closeAria")}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {stats.count === 0 ? (
          <p className={styles.empty}>{t("category.empty")}</p>
        ) : (
          <>
            <div className={styles.total}>
              {formatMoney(stats.total, baseCurrency)}
              <small>{t("category.shareOfPeriod", { pct: Math.round(share * 100) })}</small>
            </div>

            <dl className={styles.stats}>
              <div className={styles.stat}>
                <dt>{t("category.transactions")}</dt>
                <dd>{stats.count}</dd>
              </div>
              <div className={styles.stat}>
                <dt>{t("category.avgPerTx")}</dt>
                <dd>{formatMoney(stats.mean, baseCurrency)}</dd>
              </div>
              <div className={styles.stat}>
                <dt>{t("category.median")}</dt>
                <dd>{formatMoney(stats.median, baseCurrency)}</dd>
              </div>
              <div className={styles.stat}>
                <dt>{t("category.largest")}</dt>
                <dd>{formatMoney(stats.max, baseCurrency)}</dd>
              </div>
            </dl>

            {trend.length > 1 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>{t("category.trendTitle")}</h3>
                <div
                  className={styles.trend}
                  role="img"
                  aria-label={t("category.trendTitle")}
                >
                  {trend.map((p, i) => (
                    <div key={i} className={styles.trendCol} title={`${p.label}: ${formatMoney(p.total, baseCurrency)}`}>
                      <div
                        className={styles.trendBar}
                        style={{
                          height: `${(p.total / trendMax) * 100}%`,
                          background: color,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className={styles.trendAxis}>
                  <span>{trend[0].label}</span>
                  <span>{trend[trend.length - 1].label}</span>
                </div>
              </section>
            )}

            {topNotes.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>{t("category.topNotes")}</h3>
                <ul className={styles.notes}>
                  {topNotes.slice(0, TOP_NOTES).map((n) => (
                    <li key={n.note} className={styles.noteRow}>
                      <span className={styles.noteText}>{n.note}</span>
                      {n.count > 1 && (
                        <span className={styles.noteCount}>×{n.count}</span>
                      )}
                      <span className={styles.noteTotal}>
                        {formatMoney(n.total, baseCurrency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </aside>
    </>
  );
}
