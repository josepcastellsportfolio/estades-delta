import type { BlockSchema } from '@plone/types';

const PropertyHeroSchema = (): BlockSchema => ({
  title: 'Property hero',
  fieldsets: [
    {
      id: 'default',
      title: 'Hero',
      fields: ['title', 'subtitle', 'hero_image', 'capacity'],
    },
  ],
  properties: {
    title: { title: 'Title', type: 'string' },
    subtitle: { title: 'Subtitle', type: 'string' },
    hero_image: { title: 'Hero image (URL)', type: 'string', widget: 'url' },
    capacity: { title: 'Max guests', type: 'integer' },
  },
  required: [],
});

export default PropertyHeroSchema;
