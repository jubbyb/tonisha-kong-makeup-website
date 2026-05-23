// ─── Price + currency formatting ──────────────────────────────────────────────
// Price shape is encoded in the (price, price_max) pair — see docs/adr/0001.

export type Currency = 'JMD' | 'USD';

export const CURRENCIES: Currency[] = ['JMD', 'USD'];

const SYMBOL: Record<Currency, string> = { JMD: 'J$', USD: 'US$' };

/** Symbol for a currency code; defaults to JMD for unknown/missing values. */
export function currencySymbol(currency?: string | null): string {
  return SYMBOL[currency as Currency] ?? SYMBOL.JMD;
}

/** A single amount with its currency symbol and thousands separators, e.g. "J$6,000". */
export function formatAmount(n: number, currency?: string | null): string {
  return currencySymbol(currency) + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export interface Priced {
  price: number | null | undefined;
  price_max?: number | null;
  currency?: string | null;
}

/**
 * Render a service price per the (price, price_max) convention:
 *   price NULL          → "Price on consult"
 *   price_max NULL      → "from J$X"
 *   price_max === price → "J$X"
 *   price_max > price   → "J$X – J$Y"
 */
export function formatPrice(p: Priced): string {
  if (p.price == null) return 'Price on consult';
  const { price, price_max, currency } = p;
  if (price_max == null) return `from ${formatAmount(price, currency)}`;
  if (price_max <= price) return formatAmount(price, currency);
  return `${formatAmount(price, currency)} – ${formatAmount(price_max, currency)}`;
}
