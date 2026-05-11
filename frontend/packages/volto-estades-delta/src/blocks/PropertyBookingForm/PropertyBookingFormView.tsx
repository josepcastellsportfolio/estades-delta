import React, { useMemo, useState } from 'react';
import Button from '../../components/atoms/Button';
import Heading from '../../components/atoms/Heading';
import Stack from '../../components/atoms/Stack';
import Price from '../../components/atoms/Price';
import { computeBookingTotal, type PricingBreakdown } from './pricing';
import './PropertyBookingForm.scss';

export interface PropertyBookingFormData {
  '@type': 'propertyBookingForm';
  heading?: string;
  /** Pricing parameters — typically populated from the parent Property. */
  basePriceLowSeason?: number;
  basePriceMidSeason?: number;
  basePriceHighSeason?: number;
  cleaningFee?: number;
  touristTaxPerNight?: number;
  maxGuests?: number;
  /** Used by the mock commission calc; controls 6% vs 10%. */
  source?: 'direct_microsite' | 'direct_marketplace';
  currency?: string;
  locale?: string;
}

interface ViewProps {
  data: PropertyBookingFormData;
  className?: string;
  /**
   * Called when the user clicks the "Reservar" button after we've computed a
   * valid total. The parent decides what happens next (open Stripe Elements,
   * navigate to a checkout page, etc.).
   */
  onSubmit?: (payload: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    infants: number;
    breakdown: PricingBreakdown;
  }) => void;
}

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const PropertyBookingFormView: React.FC<ViewProps> = ({
  data,
  className,
  onSubmit,
}) => {
  const [checkIn, setCheckIn] = useState<string>(todayISO(7));
  const [checkOut, setCheckOut] = useState<string>(todayISO(10));
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);

  const maxGuests = data.maxGuests ?? 99;
  const totalGuests = adults + children + infants;

  const dateError = useMemo(() => {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) {
      return 'Format de data invàlid.';
    }
    if (co <= ci) return "La sortida ha de ser després de l'entrada.";
    return null;
  }, [checkIn, checkOut]);

  const guestError = useMemo(() => {
    if (adults < 1) return 'Cal almenys un adult.';
    if (totalGuests > maxGuests)
      return `Aquesta propietat acull com a màxim ${maxGuests} hostes.`;
    return null;
  }, [adults, totalGuests, maxGuests]);

  const breakdown = useMemo<PricingBreakdown | null>(() => {
    if (dateError || guestError) return null;
    return computeBookingTotal({
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      adults,
      children,
      infants,
      basePriceLowSeason: data.basePriceLowSeason ?? 0,
      basePriceMidSeason:
        data.basePriceMidSeason ?? data.basePriceLowSeason ?? 0,
      basePriceHighSeason:
        data.basePriceHighSeason ??
        data.basePriceMidSeason ??
        data.basePriceLowSeason ??
        0,
      cleaningFee: data.cleaningFee,
      touristTaxPerNight: data.touristTaxPerNight,
      source: data.source,
    });
  }, [
    dateError,
    guestError,
    checkIn,
    checkOut,
    adults,
    children,
    infants,
    data.basePriceLowSeason,
    data.basePriceMidSeason,
    data.basePriceHighSeason,
    data.cleaningFee,
    data.touristTaxPerNight,
    data.source,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown || breakdown.total <= 0) return;
    onSubmit?.({ checkIn, checkOut, adults, children, infants, breakdown });
  };

  const currency = data.currency ?? 'EUR';
  const locale = data.locale ?? 'ca-ES';

  return (
    <section
      className={`block propertyBookingForm ${className ?? ''}`}
      data-block-type="propertyBookingForm"
    >
      <form className="propertyBookingForm" onSubmit={handleSubmit} noValidate>
        <Stack direction="vertical" gap={4}>
          {data.heading ? <Heading level={2}>{data.heading}</Heading> : null}

          <div className="propertyBookingForm__row">
            <div className="propertyBookingForm__field">
              <label className="propertyBookingForm__label" htmlFor="ed-ci">
                Entrada
              </label>
              <input
                id="ed-ci"
                type="date"
                className="propertyBookingForm__input"
                value={checkIn}
                min={todayISO()}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="propertyBookingForm__field">
              <label className="propertyBookingForm__label" htmlFor="ed-co">
                Sortida
              </label>
              <input
                id="ed-co"
                type="date"
                className="propertyBookingForm__input"
                value={checkOut}
                min={checkIn || todayISO(1)}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>
          {dateError ? (
            <div className="propertyBookingForm__error" role="alert">
              {dateError}
            </div>
          ) : null}

          <div className="propertyBookingForm__row">
            <div className="propertyBookingForm__field">
              <label className="propertyBookingForm__label" htmlFor="ed-ad">
                Adults
              </label>
              <input
                id="ed-ad"
                type="number"
                min={1}
                max={maxGuests}
                className="propertyBookingForm__input"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value || 0))}
              />
            </div>
            <div className="propertyBookingForm__field">
              <label className="propertyBookingForm__label" htmlFor="ed-ch">
                Nens
              </label>
              <input
                id="ed-ch"
                type="number"
                min={0}
                max={maxGuests}
                className="propertyBookingForm__input"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value || 0))}
              />
            </div>
          </div>
          <div className="propertyBookingForm__field">
            <label className="propertyBookingForm__label" htmlFor="ed-in">
              Bebès
            </label>
            <input
              id="ed-in"
              type="number"
              min={0}
              className="propertyBookingForm__input"
              value={infants}
              onChange={(e) => setInfants(Number(e.target.value || 0))}
            />
          </div>
          {guestError ? (
            <div className="propertyBookingForm__error" role="alert">
              {guestError}
            </div>
          ) : null}

          {breakdown && breakdown.total > 0 ? (
            <div className="propertyBookingForm__breakdown">
              <div className="propertyBookingForm__breakdown-row">
                <span>
                  <Price
                    amount={breakdown.averageNightlyRate}
                    currency={currency}
                    locale={locale}
                  />{' '}
                  × {breakdown.nights} nits
                </span>
                <Price
                  amount={breakdown.subtotal}
                  currency={currency}
                  locale={locale}
                />
              </div>
              {breakdown.cleaningFee > 0 ? (
                <div className="propertyBookingForm__breakdown-row">
                  <span>Neteja</span>
                  <Price
                    amount={breakdown.cleaningFee}
                    currency={currency}
                    locale={locale}
                  />
                </div>
              ) : null}
              {breakdown.touristTaxTotal > 0 ? (
                <div className="propertyBookingForm__breakdown-row">
                  <span>Taxa turística</span>
                  <Price
                    amount={breakdown.touristTaxTotal}
                    currency={currency}
                    locale={locale}
                  />
                </div>
              ) : null}
              <div className="propertyBookingForm__breakdown-row propertyBookingForm__breakdown-row--total">
                <span>Total</span>
                <Price
                  amount={breakdown.total}
                  currency={currency}
                  locale={locale}
                  size="lg"
                />
              </div>
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            disabled={!breakdown || breakdown.total <= 0}
          >
            Reservar
          </Button>
        </Stack>
      </form>
    </section>
  );
};

export default PropertyBookingFormView;
