import type { Expense, RateMap } from "../types";
import { formatMoney } from "../lib/currency";
import { sumByCurrency, totalInBase } from "../lib/summary";
import styles from "./SummaryCards.module.css";

interface Props {
  expenses: Expense[];
  baseCurrency: string;
  rates: RateMap;
}

export function SummaryCards({ expenses, baseCurrency, rates }: Props) {
  const perCurrency = sumByCurrency(expenses);
  const { total, missing } = totalInBase(expenses, baseCurrency, rates);
  const currencies = Object.keys(perCurrency);

  return (
    <div className={styles.grid}>
      <div className={`card ${styles.totalCard}`}>
        <span className={styles.caption}>Total ({baseCurrency})</span>
        <strong className={styles.total}>
          {missing && "≈ "}
          {formatMoney(total, baseCurrency)}
        </strong>
        <span className={styles.meta}>
          {expenses.length} expense{expenses.length === 1 ? "" : "s"}
          {currencies.length > 1 && ` · ${currencies.length} currencies`}
        </span>
      </div>

      <div className={`card ${styles.breakdown}`}>
        <span className={styles.caption}>By currency</span>
        {currencies.length === 0 ? (
          <span className="muted">—</span>
        ) : (
          <ul className={styles.currencyList}>
            {currencies
              .sort((a, b) => perCurrency[b] - perCurrency[a])
              .map((code) => (
                <li key={code}>
                  <span className={styles.code}>{code}</span>
                  <span className={styles.value}>
                    {formatMoney(perCurrency[code], code)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
