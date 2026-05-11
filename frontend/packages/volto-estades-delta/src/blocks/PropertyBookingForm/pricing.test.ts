import { computeBookingTotal } from './pricing';

const baseInput = {
  basePriceLowSeason: 80,
  basePriceMidSeason: 110,
  basePriceHighSeason: 160,
  cleaningFee: 50,
  touristTaxPerNight: 1.1,
};

describe('computeBookingTotal', () => {
  it('returns zeros when checkOut <= checkIn', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-08-01'),
      checkOut: new Date('2026-08-01'),
      adults: 2,
    });
    expect(out.nights).toBe(0);
    expect(out.total).toBe(0);
  });

  it('charges high-season for August nights', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-08-01'),
      checkOut: new Date('2026-08-04'), // 3 nights
      adults: 2,
    });
    expect(out.nights).toBe(3);
    expect(out.subtotal).toBe(3 * 160);
    expect(out.cleaningFee).toBe(50);
    expect(out.touristTaxTotal).toBe(3 * 1.1 * 2);
    expect(out.total).toBe(3 * 160 + 50 + 3 * 1.1 * 2);
  });

  it('charges low-season for January nights', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-01-10'),
      checkOut: new Date('2026-01-12'),
      adults: 2,
    });
    expect(out.subtotal).toBe(2 * 80);
  });

  it('charges mid-season for May', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-05-10'),
      checkOut: new Date('2026-05-13'),
      adults: 1,
    });
    expect(out.subtotal).toBe(3 * 110);
  });

  it('exempts children and infants from the tourist tax', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-08-01'),
      checkOut: new Date('2026-08-03'),
      adults: 2,
      children: 2,
      infants: 1,
    });
    expect(out.touristTaxTotal).toBe(2 * 1.1 * 2); // 2 adults only
  });

  it('applies 6% commission for direct_microsite by default', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-01-10'),
      checkOut: new Date('2026-01-12'),
      adults: 2,
    });
    expect(out.commissionRate).toBe(0.06);
    expect(out.commissionAmount).toBeCloseTo(out.total * 0.06, 2);
    expect(out.ownerPayout).toBeCloseTo(out.total * 0.94, 2);
  });

  it('applies 10% commission for direct_marketplace', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-01-10'),
      checkOut: new Date('2026-01-12'),
      adults: 2,
      source: 'direct_marketplace',
    });
    expect(out.commissionRate).toBe(0.1);
    expect(out.commissionAmount).toBeCloseTo(out.total * 0.1, 2);
  });

  it('emits one nightlyRates entry per night', () => {
    const out = computeBookingTotal({
      ...baseInput,
      checkIn: new Date('2026-06-29'),
      checkOut: new Date('2026-07-02'), // mid, high, high
      adults: 2,
    });
    expect(out.nightlyRates).toEqual([110, 160, 160]);
  });
});
