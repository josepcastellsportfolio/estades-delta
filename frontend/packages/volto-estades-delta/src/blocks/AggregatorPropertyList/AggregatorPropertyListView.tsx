/**
 * AggregatorPropertyList — View component.
 *
 * Renders a grid of Property cards filtered by the URL search params written
 * by the sibling AggregatorFilters block. Also re-fetches when it receives
 * the `aggregatorFiltersChange` custom event so filters and list stay in
 * sync without a full page reload.
 *
 * Data flow:
 *   1. Mount → read URL params → fetch `/++api++/@search?...`
 *   2. Listen `aggregatorFiltersChange` window event → re-fetch
 *   3. Pagination buttons → re-fetch with new b_start
 *
 * Plone @search is used (not @querystring-search) because the filters are
 * simple field equality / range; @search accepts `portal_type`, `zone`,
 * `b_start`, `b_size`, `metadata_fields`. The `guests` and date filters are
 * applied client-side as a fallback because Plone Property has no native
 * availability index yet (Day 5+ work).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import AggregatorPropertyCardView, {
  type AggregatorPropertyCardData,
} from '../AggregatorPropertyCard/AggregatorPropertyCardView';
import { aggregatorPropertyListMessages as m } from '../../i18n/messages';
import './AggregatorPropertyList.scss';
import type { AggregatorPropertyListData } from './schema';

export interface FilterParams {
  checkin: string;
  checkout: string;
  guests: number;
  zone: string;
}

interface PloneSearchItem {
  '@id': string;
  '@type': string;
  UID?: string;
  title?: string;
  description?: string;
  short_name?: string;
  municipality?: string;
  zone?: string;
  max_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  base_price_low_season?: number;
  base_price_mid_season?: number;
  base_price_high_season?: number;
  image?: { scales?: { preview?: { download?: string } }; download?: string };
  image_field?: string;
}

interface PloneSearchResponse {
  items_total: number;
  items: PloneSearchItem[];
  batching?: { next?: string; prev?: string };
}

const DEFAULT_PAGE_SIZE = 12;
const METADATA_FIELDS = [
  'UID',
  'title',
  'description',
  'short_name',
  'municipality',
  'zone',
  'max_guests',
  'bedrooms',
  'bathrooms',
  'base_price_low_season',
  'base_price_mid_season',
  'base_price_high_season',
  'image',
];

function readParamsFromURL(): FilterParams {
  if (typeof window === 'undefined') {
    return { checkin: '', checkout: '', guests: 1, zone: '' };
  }
  const p = new URLSearchParams(window.location.search);
  return {
    checkin: p.get('checkin') ?? '',
    checkout: p.get('checkout') ?? '',
    guests: parseInt(p.get('guests') ?? '1', 10) || 1,
    zone: p.get('zone') ?? '',
  };
}

function buildSearchUrl(
  filters: FilterParams,
  bStart: number,
  pageSize: number,
): string {
  const qs = new URLSearchParams();
  qs.set('portal_type', 'Property');
  qs.set('b_start', String(bStart));
  qs.set('b_size', String(pageSize));
  qs.set('sort_on', 'sortable_title');
  if (filters.zone) qs.set('zone', filters.zone);
  for (const field of METADATA_FIELDS) qs.append('metadata_fields', field);
  return `/++api++/@search?${qs.toString()}`;
}

function pickFromPrice(item: PloneSearchItem): number | undefined {
  const candidates = [
    item.base_price_low_season,
    item.base_price_mid_season,
    item.base_price_high_season,
  ].filter((v): v is number => typeof v === 'number');
  return candidates.length > 0 ? Math.min(...candidates) : undefined;
}

function pickImageUrl(item: PloneSearchItem): string | undefined {
  const img = item.image;
  if (!img) return undefined;
  return img.scales?.preview?.download ?? img.download;
}

function itemToCardData(item: PloneSearchItem): AggregatorPropertyCardData {
  const location = [item.municipality, item.zone]
    .filter(Boolean)
    .join(' · ');
  return {
    '@type': 'aggregatorPropertyCard',
    href: item['@id'],
    title: item.title,
    location: location || undefined,
    image: pickImageUrl(item),
    capacity: item.max_guests,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    fromPrice: pickFromPrice(item),
    currency: 'EUR',
    locale: 'ca-ES',
  };
}

function applyClientSideFilters(
  items: PloneSearchItem[],
  filters: FilterParams,
): PloneSearchItem[] {
  return items.filter((item) => {
    if (filters.guests > 1 && typeof item.max_guests === 'number') {
      if (item.max_guests < filters.guests) return false;
    }
    return true;
  });
}

interface AggregatorPropertyListViewProps {
  data: AggregatorPropertyListData;
}

const AggregatorPropertyListView: React.FC<AggregatorPropertyListViewProps> = ({
  data,
}) => {
  const intl = useIntl();
  const pageSize = data.pageSize ?? DEFAULT_PAGE_SIZE;
  const emptyMessage =
    data.emptyMessage ?? intl.formatMessage(m.empty);

  const [filters, setFilters] = useState<FilterParams>({
    checkin: '',
    checkout: '',
    guests: 1,
    zone: '',
  });
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<PloneSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController to cancel in-flight requests when filters change.
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(
    async (currentFilters: FilterParams, currentPage: number) => {
      if (typeof window === 'undefined') return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const url = buildSearchUrl(
          currentFilters,
          currentPage * pageSize,
          pageSize,
        );
        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Plone responded ${res.status}`);
        }
        const body = (await res.json()) as PloneSearchResponse;
        const filtered = applyClientSideFilters(body.items ?? [], currentFilters);
        setItems(filtered);
        setTotal(body.items_total ?? filtered.length);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(intl.formatMessage(m.error));
        setItems([]);
        setTotal(0);
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [pageSize, intl],
  );

  // On mount: read URL params and do the first fetch.
  useEffect(() => {
    const initial = readParamsFromURL();
    setFilters(initial);
    fetchResults(initial, 0);
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to AggregatorFilters submit events.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const next = (e as CustomEvent<FilterParams>).detail;
      if (!next) return;
      setFilters(next);
      setPage(0);
      fetchResults(next, 0);
    };
    window.addEventListener('aggregatorFiltersChange', handler);
    return () =>
      window.removeEventListener('aggregatorFiltersChange', handler);
  }, [fetchResults]);

  const handlePrev = useCallback(() => {
    if (page === 0) return;
    const next = page - 1;
    setPage(next);
    fetchResults(filters, next);
  }, [page, filters, fetchResults]);

  const handleNext = useCallback(() => {
    const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    if (page >= maxPage) return;
    const next = page + 1;
    setPage(next);
    fetchResults(filters, next);
  }, [page, total, pageSize, filters, fetchResults]);

  const cards = useMemo(() => items.map(itemToCardData), [items]);
  const hasMore = total > pageSize;
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <div className="aggregatorPropertyList">
      {data.heading ? (
        <h2 className="aggregatorPropertyList__heading">{data.heading}</h2>
      ) : null}

      {!loading && !error && total > 0 ? (
        <p className="aggregatorPropertyList__count">
          <FormattedMessage
            {...(total === 1 ? m.countSingular : m.countPlural)}
            values={{ count: total }}
          />
        </p>
      ) : null}

      {loading ? (
        <div className="aggregatorPropertyList__status" role="status">
          <FormattedMessage {...m.loading} />
        </div>
      ) : null}

      {!loading && error ? (
        <div
          className="aggregatorPropertyList__status aggregatorPropertyList__status--error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && cards.length === 0 ? (
        <div className="aggregatorPropertyList__status">{emptyMessage}</div>
      ) : null}

      {!loading && !error && cards.length > 0 ? (
        <div className="aggregatorPropertyList__grid">
          {cards.map((card) => (
            <AggregatorPropertyCardView
              key={card.href ?? card.title}
              data={card}
            />
          ))}
        </div>
      ) : null}

      {!loading && !error && hasMore ? (
        <div className="aggregatorPropertyList__pagination">
          <button type="button" onClick={handlePrev} disabled={page === 0}>
            <FormattedMessage {...m.prev} />
          </button>
          <span>
            <FormattedMessage
              {...m.page}
              values={{ current: page + 1, total: maxPage + 1 }}
            />
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={page >= maxPage}
          >
            <FormattedMessage {...m.next} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AggregatorPropertyListView;
