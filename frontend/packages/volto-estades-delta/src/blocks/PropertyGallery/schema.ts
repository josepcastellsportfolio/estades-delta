import type { BlockSchema } from '@plone/types';

const PropertyGallerySchema = (): BlockSchema => ({
  title: 'Property gallery',
  fieldsets: [
    {
      id: 'default',
      title: 'Gallery',
      fields: ['hero', 'images', 'total', 'alt'],
    },
  ],
  properties: {
    hero: { title: 'Hero image URL', type: 'string', widget: 'url' },
    images: {
      title: 'Secondary image URLs (one per line)',
      type: 'string',
      widget: 'textarea',
      description: 'Up to 4 secondary images shown in a 2x2 grid.',
    },
    total: {
      title: 'Total photo count',
      type: 'integer',
      description: 'Trigger the "+N more" overlay when greater than visible.',
    },
    alt: { title: 'Alt text', type: 'string' },
  },
  required: [],
});

export default PropertyGallerySchema;
