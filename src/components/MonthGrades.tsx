import type { ReactNode } from "react";
import type { GradeResult } from "../lib/grade";
import { formatMoney } from "../lib/currency";
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
            <p className={styles.desc}>{result.label}</p>
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
  return (
    <div className="card">
      <h2>Grades · {monthLabel}</h2>

      <div className={styles.grid}>
        <GradeSlot
          title="Spending"
          measuredAgainst={
            spending?.targetSource === "average"
              ? "vs Average spend"
              : "vs Overall budget"
          }
          result={spending?.grade ?? null}
          pending="Set an Overall budget below, or come back once a prior month has some expenses to compare against."
        >
          {spending && (
            <>
              <p className={styles.figures}>
                {formatMoney(monthTotal, baseCurrency)} of{" "}
                {spending.targetSource === "budget"
                  ? formatMoney(spending.target, baseCurrency)
                  : `your ~${formatMoney(spending.target, baseCurrency)} average`}{" "}
                ({Math.round(spending.grade.ratio * 100)}%)
              </p>
              {spending.targetSource === "average" && (
                <p className={styles.note}>
                  No Overall budget set — grading against your average monthly
                  spend instead.
                </p>
              )}
            </>
          )}
        </GradeSlot>

        <GradeSlot
          title="Savings"
          measuredAgainst="vs Income"
          result={savings?.grade ?? null}
          pending="Record some income this month to get a savings grade."
        >
          {savings && (
            <p className={styles.figures}>
              Kept {formatMoney(savings.net, baseCurrency)} of{" "}
              {formatMoney(savings.income, baseCurrency)} earned (
              {Math.round(savings.grade.ratio * 100)}%)
            </p>
          )}
        </GradeSlot>
      </div>
    </div>
  );
}
