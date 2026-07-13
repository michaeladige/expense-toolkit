import type { RateMap } from "../types";

/**
 * Convert an amount between two currencies using a rate map expressed as
 * "units of currency X per 1 unit of the map's base currency" (the shape the
 * Frankfurter API returns, with the base itself added as 1).
 *
 * Returns `null` when a required rate is missing so callers can fall back to
 * per-currency totals instead of showing a wrong number.
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: RateMap
): number | null {
  if (from === to) return amount;
  const rFrom = rates[from];
  const rTo = rates[to];
  if (rFrom == null || rTo == null) return null;
  const inBase = amount / rFrom;
  return inBase * rTo;
}

/** Format a numeric amount as currency using the platform locale. */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    // Unknown/unsupported currency code — degrade gracefully.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Symbol (or code) for a currency, for compact display. */
export function currencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}
