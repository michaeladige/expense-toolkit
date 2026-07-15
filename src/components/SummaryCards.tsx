import type { Expense, Income, RateMap } from "../types";
import { formatMoney } from "../lib/currency";
import { netInBase, sumByCurrency } from "../lib/summary";
import styles from "./SummaryCards.module.css";

interface Props {
  expenses: Expense[];
  incomes: Income[];
  baseCurrency: string;
  rates: RateMap;
}

export function SummaryCards({ expenses, incomes, baseCurrency, rates }: Props) {
  const perCurrency = sumByCurrency(expenses);
  const { income, expense, net, missing } = netInBase(
    incomes,
    expenses,
    baseCurrency,
    rates
  );
  const currencies = Object.keys(perCurrency);
  const count = expenses.length + incomes.length;

  return (
    <div className={styles.grid}>
      <div className={`card ${styles.totalCard}`}>
        <span className={styles.caption}>Net ({baseCurrency})</span>
        <strong
          className={`${styles.total} ${net < 0 ? styles.negative : styles.positive}`}
        >
          {missing && "≈ "}
          {net >= 0 && "+"}
          {formatMoney(net, baseCurrency)}
        </strong>
        <span className={styles.meta}>
          {count} transaction{count === 1 ? "" : "s"}
          {currencies.length > 1 && ` · ${currencies.length} currencies`}
        </span>
      </div>

      <div className={`card ${styles.flowCard}`}>
        <div>
          <span className={styles.caption}>Income</span>
          <strong className={`${styles.flowValue} ${styles.positive}`}>
            {formatMoney(income, baseCurrency)}
          </strong>
        </div>
        <div>
          <span className={styles.caption}>Expenses</span>
          <strong className={styles.flowValue}>
            {formatMoney(expense, baseCurrency)}
          </strong>
        </div>
      </div>

      <div className={`card ${styles.breakdown}`}>
        <span className={styles.caption}>Expenses by currency</span>
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
