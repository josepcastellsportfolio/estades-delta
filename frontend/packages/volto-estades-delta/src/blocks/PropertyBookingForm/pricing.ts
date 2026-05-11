/**
 * Mock pricing engine used by PropertyBookingForm in Phase 1. Replicates the
 * structure that the backend `compute_booking_total` will return in Phase 2,
 * so the form's UI doesn't change when we wire the real call.
 *
 * Inputs (in major currency units, e.g. 85 = 85€):
 *   - basePriceLowSeason, basePriceMidSeason, basePriceHighSeason
 *   - cleaningFee  (flat, applied once per stay)
 *   - touristTaxPerNight  (per night, per adult — children & infants free)
 *   - source: 'direct_microsite' | 'direct_marketplace' (controls commission)
 *
 * Season lookup is deliberately naïve in this stub:
 *   Jan-Mar, Nov-Dec → low
 *   Apr-Jun, Oct     → mid
 *   Jul-Sep          → high
 *
 * Phase 2 will swap this for a Beds24-driven rate calendar.
 */

export interface PricingInputs {
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children?: number;
  infants?: number;
  basePriceLowSeason: number;
  basePriceMidSeason: number;
  basePriceHighSeason: number;
  cleaningFee?: number;
  touristTaxPerNight?: number;
  source?: 'direct_microsite' | 'direct_marketplace';
}

export interface PricingBreakdown {
  nights: number;
  averageNightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  touristTaxTotal: number;
  total: number;
  commissionRate: number;
  commissionAmount: number;
  ownerPayout: number;
  /** Per-night rates the engine used, one entry per night. */
  nightlyRates: number[];
}

const MS_PER_DAY = 86_400_000;

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(0, Math.round(diff / MS_PER_DAY));
}

function seasonRate(d: Date, low: number, mid: number, high: number): number {
  // d.getMonth() is 0-based: 0 Jan ... 11 Dec
  const m = d.getMonth();
  if (m >= 6 && m <= 8) return high; // Jul Aug Sep
  if (m === 3 || m === 4 || m === 5 || m === 9) return mid; // Apr May Jun Oct
  return low;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const COMMISSION_RATES = {
  direct_microsite: 0.06,
  direct_marketplace: 0.1,
} as const;

export function computeBookingTotal(input: PricingInputs): PricingBreakdown {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights <= 0) {
    return {
      nights: 0,
      averageNightlyRate: 0,
      subtotal: 0,
      cleaningFee: 0,
      touristTaxTotal: 0,
      total: 0,
      commissionRate: 0,
      commissionAmount: 0,
      ownerPayout: 0,
      nightlyRates: [],
    };
  }

  // Walk each night and pick the season rate.
  const nightlyRates: number[] = [];
  for (let i = 0; i < nights; i++) {
    const d = new Date(input.checkIn.getTime() + i * MS_PER_DAY);
    nightlyRates.push(
      seasonRate(
        d,
        input.basePriceLowSeason,
        input.basePriceMidSeason,
        input.basePriceHighSeason,
      ),
    );
  }

  const subtotal = round2(nightlyRates.reduce((s, n) => s + n, 0));
  const averageNightlyRate = round2(subtotal / nights);
  const cleaning = round2(input.cleaningFee ?? 0);
  const taxPerNight = input.touristTaxPerNight ?? 0;
  const taxableHeads = input.adults; // children & infants exempt per BOE TIR
  const touristTaxTotal = round2(nights * taxPerNight * taxableHeads);
  const total = round2(subtotal + cleaning + touristTaxTotal);

  const rate = COMMISSION_RATES[input.source ?? 'direct_microsite'];
  const commissionAmount = round2(total * rate);
  const ownerPayout = round2(total - commissionAmount);

  return {
    nights,
    averageNightlyRate,
    subtotal,
    cleaningFee: cleaning,
    touristTaxTotal,
    total,
    commissionRate: rate,
    commissionAmount,
    ownerPayout,
    nightlyRates,
  };
}
