import type { ReactNode } from "react";
import type { GradeResult } from "../lib/grade";
import { formatMoney } from "../lib/currency";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./MonthGrades.module.css";

export interface SpendingInfo {
  grade: GradeResult;
  target: number;
  targetSource: "budget" | "average";
}

export interface SavingsInfo {
  grade: GradeResult;
  income: number;
  net: number;
}

interface Props {
  spending: SpendingInfo | null;
  savings: SavingsInfo | null;
  monthTotal: number;
  baseCurrency: string;
  monthLabel: string;
}

/**
 * One grade, or the reason there isn't one yet.
 *
 * `measuredAgainst` is deliberately always rendered, gradeable or not: the two
 * grades score the same month against different yardsticks, and which yardstick
 * is in play is what makes the letter mean anything.
 */
function GradeSlot({
  title,
  measuredAgainst,
  result,
  pending,
  children,
}: {
  title: string;
  measuredAgainst: string;
  result: GradeResult | null;
  /** Shown instead of a grade when `result` is null. */
  pending: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className={styles.grade}>
      <div className={styles.gradeHead}>
        <span className={styles.gradeTitle}>{title}</span>
        <span className={styles.against}>{measuredAgainst}</span>
      </div>
      {result == null ? (
        <p className={styles.pending}>{pending}</p>
      ) : (
        <div className={styles.body}>
          <div
            className={styles.badge}
            style={{ color: result.color, borderColor: result.color }}
          >
            {result.grade}
          </div>
          <div className={styles.details}>
            <p className={styles.desc}>{t(result.label)}</p>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthGrades({
  spending,
  savings,
  monthTotal,
  baseCurrency,
  monthLabel,
}: Props) {
  const { t } = useI18n();
  return (
    <div className="card">
      <h2>{t("grades.title", { month: monthLabel })}</h2>

      <div className={styles.grid}>
        <GradeSlot
          title={t("grades.spending")}
          measuredAgainst={
            spending?.targetSource === "average"
              ? t("grades.vsAverage")
              : t("grades.vsBudget")
          }
          result={spending?.grade ?? null}
          pending={t("grades.spendingPending")}
        >
          {spending && (
            <>
              <p className={styles.figures}>
                {spending.targetSource === "budget"
                  ? t("grades.ofBudget", {
                      total: formatMoney(monthTotal, baseCurrency),
                      target: formatMoney(spending.target, baseCurrency),
                      pct: Math.round(spending.grade.ratio * 100),
                    })
                  : t("grades.ofAverage", {
                      total: formatMoney(monthTotal, baseCurrency),
                      target: formatMoney(spending.target, baseCurrency),
                      pct: Math.round(spending.grade.ratio * 100),
                    })}
              </p>
              {spending.targetSource === "average" && (
                <p className={styles.note}>{t("grades.averageNote")}</p>
              )}
            </>
          )}
        </GradeSlot>

        <GradeSlot
          title={t("grades.savings")}
          measuredAgainst={t("grades.vsIncome")}
          result={savings?.grade ?? null}
          pending={t("grades.savingsPending")}
        >
          {savings && (
            <p className={styles.figures}>
              {t("grades.kept", {
                net: formatMoney(savings.net, baseCurrency),
                income: formatMoney(savings.income, baseCurrency),
                pct: Math.round(savings.grade.ratio * 100),
              })}
            </p>
          )}
        </GradeSlot>
      </div>
    </div>
  );
}
