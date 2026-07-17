import type { Category } from "../types";
import type { CategoryDelta } from "../lib/summary";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import { displayCategoryName } from "../lib/i18n/categoryName";
import styles from "./ComparisonMovers.module.css";

/** How many movers to list. */
const TOP_N = 5;

interface Props {
  /** Per-category deltas, already sorted by magnitude (biggest first). */
  movers: CategoryDelta[];
  categoryById: (id: string) => Category | undefined;
  baseCurrency: string;
}

export function ComparisonMovers({ movers, categoryById, baseCurrency }: Props) {
  const { t, lang } = useI18n();
  const top = movers.filter((m) => Math.abs(m.delta) >= 0.005).slice(0, TOP_N);

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <h2>{t("compare.title")}</h2>
        <span className={styles.sub}>{t("compare.subtitle")}</span>
      </div>

      {top.length === 0 ? (
        <p className={styles.empty}>{t("compare.empty")}</p>
      ) : (
        <ul className={styles.list}>
          {top.map((m) => {
            const cat = categoryById(m.categoryId);
            const up = m.delta > 0;
            const pct =
              m.previous !== 0 ? (m.delta / Math.abs(m.previous)) * 100 : null;
            return (
              <li key={m.categoryId} className={styles.row}>
                <span
                  className={styles.swatch}
                  style={{ background: cat?.color ?? "var(--text-muted)" }}
                  aria-hidden
                />
                <span className={styles.name}>{displayCategoryName(cat, lang)}</span>
                <span className={styles.pct}>
                  {pct != null
                    ? `${up ? "+" : "−"}${Math.abs(Math.round(pct))}%`
                    : t("compare.new")}
                </span>
                {/* More spending than last period is the bad direction. */}
                <span className={`${styles.amount} ${up ? styles.bad : styles.good}`}>
                  {up ? "+" : "−"}
                  {formatMoney(Math.abs(m.delta), baseCurrency)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
