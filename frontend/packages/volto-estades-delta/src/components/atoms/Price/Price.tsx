import React from 'react';
import './Price.scss';

export type PriceSize = 'md' | 'lg' | 'xl';

export interface PriceProps {
  /** Numeric value in major currency units (e.g. 85.0 for 85€). */
  amount: number;
  /** ISO currency code. Default 'EUR'. */
  currency?: string;
  /**
   * BCP-47 locale used for number formatting. Default 'ca-ES' to match the
   * Catalan-first marketplace. Switch on the user's intl locale upstream.
   */
  locale?: string;
  /** Suffix label, e.g. "/ nit", "/ persona". Skipped when empty. */
  suffix?: string;
  size?: PriceSize;
  /** Render as struck-through reference price (used next to a discount). */
  strikethrough?: boolean;
  /** Optional `aria-label` override. */
  ariaLabel?: string;
}

const FALLBACK_LOCALE = 'ca-ES';
const FALLBACK_CURRENCY = 'EUR';

function formatParts(
  amount: number,
  currency: string,
  locale: string,
): { value: string; currencyDisplay: string } {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).formatToParts(amount);

    let value = '';
    let currencyDisplay = '';
    for (const p of parts) {
      if (p.type === 'currency') currencyDisplay = p.value;
      else value += p.value;
    }
    return { value: value.trim(), currencyDisplay };
  } catch {
    return { value: amount.toFixed(2), currencyDisplay: currency };
  }
}

export const Price: React.FC<PriceProps> = ({
  amount,
  currency = FALLBACK_CURRENCY,
  locale = FALLBACK_LOCALE,
  suffix,
  size = 'md',
  strikethrough = false,
  ariaLabel,
}) => {
  const { value, currencyDisplay } = formatParts(amount, currency, locale);
  const cls = [
    'ed-price',
    `ed-price--size-${size}`,
    strikethrough ? 'ed-price--strikethrough' : null,
  ]
    .filter(Boolean)
    .join(' ');

  // Determine if the currency symbol goes before or after the number based on
  // locale conventions. We trust the Intl formatter's order via formatToParts.
  return (
    <span className={cls} aria-label={ariaLabel}>
      <span className="ed-price__amount">{value}</span>
      {currencyDisplay && (
        <span className="ed-price__currency">{currencyDisplay}</span>
      )}
      {suffix && <span className="ed-price__suffix">{suffix}</span>}
    </span>
  );
};

export default Price;
