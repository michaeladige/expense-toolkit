import type { GradeResult } from "../lib/grade";
import { formatMoney } from "../lib/currency";
import styles from "./SpendingGrade.module.css";

interface Props {
  info: {
    grade: GradeResult;
    target: number;
    targetSource: "budget" | "average";
  } | null;
  monthTotal: number;
  baseCurrency: string;
  monthLabel: string;
}

export function SpendingGrade({ info, monthTotal, baseCurrency, monthLabel }: Props) {
  return (
    <div className="card">
      <h2>Spending Grade · {monthLabel}</h2>

      {info == null ? (
        <p className="empty">
          Not enough data to grade this month yet. Set an Overall budget
          below, or come back once a prior month has some expenses to
          compare against.
        </p>
      ) : (
        <div className={styles.body}>
          <div
            className={styles.badge}
            style={{ color: info.grade.color, borderColor: info.grade.color }}
          >
            {info.grade.grade}
          </div>
          <div className={styles.details}>
            <p className={styles.desc}>{info.grade.label}</p>
            <p className={styles.figures}>
              {formatMoney(monthTotal, baseCurrency)} of{" "}
              {info.targetSource === "budget"
                ? formatMoney(info.target, baseCurrency)
                : `your ~${formatMoney(info.target, baseCurrency)} average`}{" "}
              ({Math.round(info.grade.ratio * 100)}%)
            </p>
            {info.targetSource === "average" && (
              <p className={styles.note}>
                No Overall budget set — grading against your average monthly
                spend instead.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
