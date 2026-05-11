import type { BlockSchema } from '@plone/types';

const PropertyAmenitiesSchema = (): BlockSchema => ({
  title: 'Property amenities',
  fieldsets: [
    {
      id: 'default',
      title: 'Amenities',
      fields: ['heading', 'items'],
    },
  ],
  properties: {
    heading: { title: 'Heading', type: 'string', default: 'Comoditats' },
    items: {
      title: 'Items (comma- or pipe-separated)',
      type: 'string',
      widget: 'textarea',
      description:
        "Llista plana d'amenities. Per a grups, edita el camp `groups` " +
        'via REST API (no exposat al formulari per simplicitat — útil per a ' +
        'tests pre-Day-3).',
    },
  },
  required: [],
});

export default PropertyAmenitiesSchema;
