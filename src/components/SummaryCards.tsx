import type { Expense, Income, RateMap } from "../types";
import { formatMoney } from "../lib/currency";
import { netInBase, sumByCurrency } from "../lib/summary";
import { useI18n } from "../lib/i18n/I18nContext";
import styles from "./SummaryCards.module.css";

/** Previous-period totals to compare against; omitted when there's no prior period. */
export interface SummaryPrev {
  income: number;
  expense: number;
  net: number;
}

interface Props {
  expenses: Expense[];
  incomes: Income[];
  baseCurrency: string;
  rates: RateMap;
  prev?: SummaryPrev | null;
}

/** A signed change badge. `goodWhenUp` decides the colour: income/net rising is
 *  good (green), expenses rising is bad (red); no colour when nothing moved. */
function DeltaBadge({
  current,
  previous,
  goodWhenUp,
  baseCurrency,
}: {
  current: number;
  previous: number;
  goodWhenUp: boolean;
  baseCurrency: string;
}) {
  const { t } = useI18n();
  const diff = current - previous;
  if (Math.abs(diff) < 0.005) {
    return (
      <span className={`${styles.delta} ${styles.deltaFlat}`} title={t("compare.vsPrev")}>
        — {t("compare.noChange")}
      </span>
    );
  }
  const up = diff > 0;
  const good = up === goodWhenUp;
  const pct = previous !== 0 ? (diff / Math.abs(previous)) * 100 : null;
  const label =
    pct != null
      ? `${Math.abs(pct) >= 999 ? "999+" : Math.round(Math.abs(pct))}%`
      : t("compare.new");
  return (
    <span
      className={`${styles.delta} ${good ? styles.deltaGood : styles.deltaBad}`}
      title={t("compare.vsPrevAmount", {
        amount: `${diff > 0 ? "+" : "−"}${formatMoney(Math.abs(diff), baseCurrency)}`,
      })}
    >
      {up ? "▲" : "▼"} {label}
    </span>
  );
}

export function SummaryCards({ expenses, incomes, baseCurrency, rates, prev }: Props) {
  const { t } = useI18n();
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
        <span className={styles.caption}>{t("summary.net", { currency: baseCurrency })}</span>
        <strong
          className={`${styles.total} ${net < 0 ? styles.negative : styles.positive}`}
        >
          {missing && "≈ "}
          {net >= 0 && "+"}
          {formatMoney(net, baseCurrency)}
        </strong>
        <span className={styles.meta}>
          {t("summary.txCount", { n: count })}
          {currencies.length > 1 &&
            ` · ${t("summary.currencyCount", { n: currencies.length })}`}
          {prev && (
            <DeltaBadge
              current={net}
              previous={prev.net}
              goodWhenUp
              baseCurrency={baseCurrency}
            />
          )}
        </span>
      </div>

      <div className={`card ${styles.flowCard}`}>
        <div className={styles.flowRow}>
          <span className={styles.caption}>{t("summary.income")}</span>
          <div className={styles.flowLine}>
            <strong className={`${styles.flowValue} ${styles.positive}`}>
              {formatMoney(income, baseCurrency)}
            </strong>
            {prev && (
              <DeltaBadge
                current={income}
                previous={prev.income}
                goodWhenUp
                baseCurrency={baseCurrency}
              />
            )}
          </div>
        </div>
        <div className={styles.flowRow}>
          <span className={styles.caption}>{t("summary.expenses")}</span>
          <div className={styles.flowLine}>
            <strong className={styles.flowValue}>
              {formatMoney(expense, baseCurrency)}
            </strong>
            {prev && (
              <DeltaBadge
                current={expense}
                previous={prev.expense}
                goodWhenUp={false}
                baseCurrency={baseCurrency}
              />
            )}
          </div>
        </div>
      </div>

      <div className={`card ${styles.breakdown}`}>
        <span className={styles.caption}>{t("summary.byCurrency")}</span>
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
