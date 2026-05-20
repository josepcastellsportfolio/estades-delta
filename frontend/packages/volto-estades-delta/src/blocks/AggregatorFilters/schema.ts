/**
 * AggregatorFilters block schema.
 *
 * The block itself has no stored data fields (it reads from / writes to the
 * URL search params at runtime). The schema only exposes an editorial heading
 * so editors can label the filter bar in the Plone backend.
 */
export interface AggregatorFiltersData {
  '@type': 'aggregatorFilters';
  heading?: string;
}

const AggregatorFiltersSchema = {
  title: 'Aggregator filters',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['heading'],
    },
  ],
  properties: {
    heading: {
      title: 'Heading',
      description: 'Optional label shown above the filter bar.',
      type: 'string',
    },
  },
  required: [],
};

export default AggregatorFiltersSchema;
