/**
 * AggregatorFilters — View component.
 *
 * Renders a search bar with three filters:
 *   • Date range  (check-in / check-out, HTML date inputs)
 *   • Capacity    (number of guests, integer input)
 *   • Zone        (area of the Delta del Ebro, static select)
 *
 * Filter state is persisted in URL search params so the page is bookmarkable
 * and the AggregatorPropertyList sibling block can read the same state via
 * `new URLSearchParams(window.location.search)`.
 *
 * Param names: `checkin`, `checkout`, `guests`, `zone`.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { aggregatorFiltersMessages as m } from '../../i18n/messages';
import './AggregatorFilters.scss';
import type { AggregatorFiltersData } from './schema';

const DELTA_ZONES = [
  'Amposta',
  'Camarles',
  "l'Ampolla",
  'Poblenou del Delta',
  'Riumar',
  "Sant Jaume d'Enveja",
  'Tortosa',
] as const;

export interface AggregatorFiltersState {
  checkin: string;
  checkout: string;
  guests: number;
  zone: string;
}

const EMPTY_STATE: AggregatorFiltersState = {
  checkin: '',
  checkout: '',
  guests: 1,
  zone: '',
};

function readParamsFromURL(): AggregatorFiltersState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  const p = new URLSearchParams(window.location.search);
  return {
    checkin: p.get('checkin') ?? '',
    checkout: p.get('checkout') ?? '',
    guests: parseInt(p.get('guests') ?? '1', 10) || 1,
    zone: p.get('zone') ?? '',
  };
}

function writeParamsToURL(state: AggregatorFiltersState): void {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (state.checkin) p.set('checkin', state.checkin);
  if (state.checkout) p.set('checkout', state.checkout);
  if (state.guests > 1) p.set('guests', String(state.guests));
  if (state.zone) p.set('zone', state.zone);
  const qs = p.toString();
  const newUrl = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.pushState({}, '', newUrl);
  // Dispatch a custom event so sibling components (e.g. AggregatorPropertyList)
  // can react without needing a shared store.
  window.dispatchEvent(new CustomEvent('aggregatorFiltersChange', { detail: state }));
}

interface AggregatorFiltersViewProps {
  data: AggregatorFiltersData;
}

const AggregatorFiltersView: React.FC<AggregatorFiltersViewProps> = ({ data }) => {
  const intl = useIntl();
  const [filters, setFilters] = useState<AggregatorFiltersState>(EMPTY_STATE);

  // Read initial state from URL on client mount.
  useEffect(() => {
    setFilters(readParamsFromURL());
  }, []);

  const handleChange = useCallback(
    (field: keyof AggregatorFiltersState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const raw = e.target.value;
        setFilters((prev) => ({
          ...prev,
          [field]: field === 'guests' ? parseInt(raw, 10) || 1 : raw,
        }));
      },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      writeParamsToURL(filters);
    },
    [filters],
  );

  const handleClear = useCallback(() => {
    setFilters(EMPTY_STATE);
    writeParamsToURL(EMPTY_STATE);
  }, []);

  const hasActiveFilters =
    filters.checkin || filters.checkout || filters.guests > 1 || filters.zone;

  // Get today as min date for both pickers.
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="aggregatorFilters">
      {data.heading ? (
        <p className="aggregatorFilters__heading">{data.heading}</p>
      ) : null}

      <form className="aggregatorFilters__form" onSubmit={handleSubmit}>
        {/* Check-in date */}
        <div className="aggregatorFilters__field">
          <label htmlFor="agg-checkin">
            <FormattedMessage {...m.checkin} />
          </label>
          <input
            id="agg-checkin"
            type="date"
            min={today}
            max={filters.checkout || undefined}
            value={filters.checkin}
            onChange={handleChange('checkin')}
          />
        </div>

        {/* Check-out date */}
        <div className="aggregatorFilters__field">
          <label htmlFor="agg-checkout">
            <FormattedMessage {...m.checkout} />
          </label>
          <input
            id="agg-checkout"
            type="date"
            min={filters.checkin || today}
            value={filters.checkout}
            onChange={handleChange('checkout')}
          />
        </div>

        {/* Guest count */}
        <div className="aggregatorFilters__field">
          <label htmlFor="agg-guests">
            <FormattedMessage {...m.guests} />
          </label>
          <input
            id="agg-guests"
            type="number"
            min={1}
            max={20}
            value={filters.guests}
            onChange={handleChange('guests')}
          />
        </div>

        {/* Zone selector */}
        <div className="aggregatorFilters__field">
          <label htmlFor="agg-zone">
            <FormattedMessage {...m.zone} />
          </label>
          <select
            id="agg-zone"
            value={filters.zone}
            onChange={handleChange('zone')}
          >
            <option value="">{intl.formatMessage(m.zoneAll)}</option>
            {DELTA_ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="aggregatorFilters__submit">
          <FormattedMessage {...m.submit} />
        </button>
      </form>

      {hasActiveFilters ? (
        <button
          type="button"
          className="aggregatorFilters__clear"
          onClick={handleClear}
        >
          <FormattedMessage {...m.clear} />
        </button>
      ) : null}
    </div>
  );
};

export default AggregatorFiltersView;
