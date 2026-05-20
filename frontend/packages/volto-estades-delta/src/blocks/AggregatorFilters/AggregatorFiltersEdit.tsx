/**
 * AggregatorFilters — Edit component (shown in Plone backend CMS mode).
 *
 * In edit mode we render a non-interactive preview of the filter bar so the
 * editor can see how it will look. Actual filter logic only runs on the public
 * view side.
 */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { aggregatorFiltersMessages as m } from '../../i18n/messages';
import './AggregatorFilters.scss';
import type { AggregatorFiltersData } from './schema';

interface AggregatorFiltersEditProps {
  data: AggregatorFiltersData;
  selected?: boolean;
}

const AggregatorFiltersEdit: React.FC<AggregatorFiltersEditProps> = ({
  data,
  selected,
}) => {
  return (
    <div
      className="aggregatorFilters"
      style={{ opacity: selected ? 1 : 0.8, pointerEvents: 'none' }}
    >
      {data.heading ? (
        <p className="aggregatorFilters__heading">{data.heading}</p>
      ) : null}

      <div className="aggregatorFilters__form">
        <div className="aggregatorFilters__field">
          <label>
            <FormattedMessage {...m.checkin} />
          </label>
          <input type="date" readOnly placeholder="dd/mm/aaaa" />
        </div>
        <div className="aggregatorFilters__field">
          <label>
            <FormattedMessage {...m.checkout} />
          </label>
          <input type="date" readOnly placeholder="dd/mm/aaaa" />
        </div>
        <div className="aggregatorFilters__field">
          <label>
            <FormattedMessage {...m.guests} />
          </label>
          <input type="number" readOnly value={1} />
        </div>
        <div className="aggregatorFilters__field">
          <label>
            <FormattedMessage {...m.zone} />
          </label>
          <select disabled>
            <option>
              <FormattedMessage {...m.zoneAll} />
            </option>
          </select>
        </div>
        <button type="button" className="aggregatorFilters__submit" disabled>
          <FormattedMessage {...m.submit} />
        </button>
      </div>
    </div>
  );
};

export default AggregatorFiltersEdit;
