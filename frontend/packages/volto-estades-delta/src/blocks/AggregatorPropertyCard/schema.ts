import type { BlockSchema } from '@plone/types';

const AggregatorPropertyCardSchema = (): BlockSchema => ({
  title: 'Aggregator property card',
  fieldsets: [
    {
      id: 'default',
      title: 'Content',
      fields: ['title', 'location', 'image', 'href', 'tag'],
    },
    {
      id: 'meta',
      title: 'Meta',
      fields: ['capacity', 'bedrooms', 'bathrooms'],
    },
    {
      id: 'commerce',
      title: 'Commerce',
      fields: ['fromPrice', 'currency', 'rating', 'ratingCount'],
    },
  ],
  properties: {
    title: { title: 'Title', type: 'string' },
    location: { title: 'Location', type: 'string' },
    image: { title: 'Image URL', type: 'string', widget: 'url' },
    href: { title: 'Property URL', type: 'string', widget: 'url' },
    tag: { title: 'Tag (top-left over image)', type: 'string' },
    capacity: { title: 'Max guests', type: 'integer' },
    bedrooms: { title: 'Bedrooms', type: 'integer' },
    bathrooms: { title: 'Bathrooms', type: 'integer' },
    fromPrice: { title: 'From price (€ / night)', type: 'number' },
    currency: { title: 'Currency code', type: 'string', default: 'EUR' },
    rating: { title: 'Rating (0..5)', type: 'number' },
    ratingCount: { title: 'Review count', type: 'integer' },
  },
  required: ['title'],
});

export default AggregatorPropertyCardSchema;
