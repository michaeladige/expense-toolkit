import { useState } from "react";
import type { Category } from "../types";
import type { DayTypeBreakdown } from "../lib/daytype";
import { DAY_TYPES, adviceLine, categoryQuip, verdictLine } from "../lib/daytype";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import { categoryNameOf, displayCategoryName } from "../lib/i18n/categoryName";
import { DAY_TYPE_COLOR, DAY_TYPE_LABEL } from "./DayTypeAnalytics";
import styles from "./DayTypeDetailsPanel.module.css";

type View = "category" | "daytype";

const VIEWS: { id: View; labelKey: string }[] = [
  { id: "category", labelKey: "view.byCategory" },
  { id: "daytype", labelKey: "view.byDayType" },
];

/** How many categories each day-type section lists before stopping. */
const TOP_N = 8;

interface Props {
  breakdown: DayTypeBreakdown;
  baseCurrency: string;
  categoryById: (id: string) => Category | undefined;
  onClose: () => void;
}

export function DayTypeDetailsPanel({
  breakdown,
  baseCurrency,
  categoryById,
  onClose,
}: Props) {
  const { t, lang, daytype } = useI18n();
  const [view, setView] = useState<View>("category");
  const { stats, categories, approximate } = breakdown;
  const nameOf = (id: string) => categoryNameOf(id, categoryById, lang);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-label={t("dayType.title")}
        aria-modal="true"
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.heading}>{t("dayType.title")}</h2>
            <span className={styles.subheading}>{t("dayType.detailsSubtitle")}</span>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={t("dayType.closeAria")}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {/* Top-level summary: workdays vs days off. */}
        <ul className={styles.summary}>
          {DAY_TYPES.map((type) => {
            const s = stats[type];
            return (
              <li key={type} className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                  <span
                    className={styles.swatch}
                    style={{ background: DAY_TYPE_COLOR[type] }}
                  />
                  {t(DAY_TYPE_LABEL[type])}
                  {type === "dayoff" && approximate && (
                    <span className={styles.approx} title={t("dayType.approxTitleShort")}>
                      {t("dayType.approx")}
                    </span>
                  )}
                </span>
                <span className={styles.summaryValue}>
                  {formatMoney(s.total, baseCurrency)}
                  <small>{formatMoney(s.average, baseCurrency)}/day</small>
                </span>
              </li>
            );
          })}
        </ul>

        <div className={styles.toggle} role="group" aria-label={t("dayType.viewAria")}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`${styles.toggleBtn} ${view === v.id ? styles.toggleActive : ""}`}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>

        {categories.length === 0 ? (
          <p className={styles.empty}>{t("dayType.emptyRecorded")}</p>
        ) : view === "category" ? (
          <ByCategory
            categories={categories}
            baseCurrency={baseCurrency}
            categoryById={categoryById}
          />
        ) : (
          <ByDayType
            breakdown={breakdown}
            baseCurrency={baseCurrency}
            categoryById={categoryById}
          />
        )}

        <p className={styles.verdict}>{verdictLine(breakdown, daytype)}</p>
        <p className={styles.advice}>💡 {adviceLine(breakdown, daytype)}</p>
        <p className={styles.quip}>🎲 {categoryQuip(breakdown, nameOf, daytype)}</p>
      </aside>
    </>
  );
}

function ByCategory({
  categories,
  baseCurrency,
  categoryById,
}: {
  categories: DayTypeBreakdown["categories"];
  baseCurrency: string;
  categoryById: (id: string) => Category | undefined;
}) {
  const { t, lang } = useI18n();
  return (
    <ul className={styles.list}>
      {categories.map((c) => {
        const cat = categoryById(c.categoryId);
        const workPct = c.total > 0 ? (c.byType.workday / c.total) * 100 : 0;
        const offPct = c.total > 0 ? (c.byType.dayoff / c.total) * 100 : 0;
        return (
          <li key={c.categoryId} className={styles.catRow}>
            <div className={styles.catHead}>
              <span className={styles.catName}>
                <span className={styles.catIcon} aria-hidden>
                  {cat?.icon ?? "•"}
                </span>
                {displayCategoryName(cat, lang)}
              </span>
              <span className={styles.catTotal}>
                {formatMoney(c.total, baseCurrency)}
              </span>
            </div>
            <div className={styles.splitTrack}>
              <span
                className={styles.splitSeg}
                style={{ width: `${workPct}%`, background: DAY_TYPE_COLOR.workday }}
              />
              <span
                className={styles.splitSeg}
                style={{ width: `${offPct}%`, background: DAY_TYPE_COLOR.dayoff }}
              />
            </div>
            <div className={styles.catMeta}>
              <span>{t("dayType.work", { money: formatMoney(c.byType.workday, baseCurrency) })}</span>
              <span>{t("dayType.off", { money: formatMoney(c.byType.dayoff, baseCurrency) })}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ByDayType({
  breakdown,
  baseCurrency,
  categoryById,
}: {
  breakdown: DayTypeBreakdown;
  baseCurrency: string;
  categoryById: (id: string) => Category | undefined;
}) {
  const { t, lang } = useI18n();
  return (
    <div className={styles.sections}>
      {DAY_TYPES.map((type) => {
        const typeTotal = breakdown.stats[type].total;
        const ranked = breakdown.categories
          .map((c) => ({ id: c.categoryId, amount: c.byType[type] }))
          .filter((c) => c.amount > 0)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, TOP_N);
        return (
          <section key={type} className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionName}>
                <span
                  className={styles.swatch}
                  style={{ background: DAY_TYPE_COLOR[type] }}
                />
                {t(DAY_TYPE_LABEL[type])}
              </span>
              <span className={styles.sectionTotal}>
                {formatMoney(typeTotal, baseCurrency)}
              </span>
            </div>
            {ranked.length === 0 ? (
              <p className={styles.sectionEmpty}>{t("dayType.nothingHere")}</p>
            ) : (
              <ul className={styles.list}>
                {ranked.map((c) => {
                  const cat = categoryById(c.id);
                  const pct = typeTotal > 0 ? (c.amount / typeTotal) * 100 : 0;
                  return (
                    <li key={c.id} className={styles.rankRow}>
                      <div className={styles.catHead}>
                        <span className={styles.catName}>
                          <span className={styles.catIcon} aria-hidden>
                            {cat?.icon ?? "•"}
                          </span>
                          {displayCategoryName(cat, lang)}
                        </span>
                        <span className={styles.catTotal}>
                          {formatMoney(c.amount, baseCurrency)}
                        </span>
                      </div>
                      <div className={styles.rankTrack}>
                        <span
                          className={styles.rankFill}
                          style={{ width: `${pct}%`, background: DAY_TYPE_COLOR[type] }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
