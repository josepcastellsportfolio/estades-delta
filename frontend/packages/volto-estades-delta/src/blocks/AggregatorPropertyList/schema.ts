/**
 * AggregatorPropertyList block schema.
 *
 * Reads filter state from URL search params (written by AggregatorFilters)
 * and from the custom `aggregatorFiltersChange` event so it can re-fetch
 * without a page reload. The block schema only exposes editorial knobs
 * (page size, heading, empty-state message).
 */
export interface AggregatorPropertyListData {
  '@type': 'aggregatorPropertyList';
  /** Optional heading shown above the grid. */
  heading?: string;
  /** Page size for paginated results (default 12). */
  pageSize?: number;
  /** Message shown when no Properties match the filters. */
  emptyMessage?: string;
}

const AggregatorPropertyListSchema = {
  title: 'Aggregator property list',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['heading', 'pageSize', 'emptyMessage'],
    },
  ],
  properties: {
    heading: {
      title: 'Heading',
      description: 'Optional heading shown above the results grid.',
      type: 'string',
    },
    pageSize: {
      title: 'Page size',
      description: 'Number of Properties per page (default 12).',
      type: 'integer',
      minimum: 1,
      maximum: 50,
    },
    emptyMessage: {
      title: 'Empty message',
      description: 'Shown when no Properties match the current filters.',
      type: 'string',
    },
  },
  required: [],
};

export default AggregatorPropertyListSchema;
