import type { BlockSchema } from '@plone/types';

const PropertyBookingFormSchema = (): BlockSchema => ({
  title: 'Property booking form',
  fieldsets: [
    {
      id: 'default',
      title: 'Form',
      fields: ['heading', 'maxGuests'],
    },
    {
      id: 'pricing',
      title: 'Pricing',
      fields: [
        'basePriceLowSeason',
        'basePriceMidSeason',
        'basePriceHighSeason',
        'cleaningFee',
        'touristTaxPerNight',
      ],
    },
    {
      id: 'channel',
      title: 'Channel',
      fields: ['source', 'currency'],
    },
  ],
  properties: {
    heading: { title: 'Heading', type: 'string', default: 'Reserva' },
    maxGuests: { title: 'Max guests', type: 'integer', default: 6 },
    basePriceLowSeason: { title: 'Low season nightly rate', type: 'number' },
    basePriceMidSeason: { title: 'Mid season nightly rate', type: 'number' },
    basePriceHighSeason: { title: 'High season nightly rate', type: 'number' },
    cleaningFee: { title: 'Cleaning fee (per stay)', type: 'number' },
    touristTaxPerNight: {
      title: 'Tourist tax (per adult per night)',
      type: 'number',
      default: 1.1,
    },
    source: {
      title: 'Booking source',
      type: 'string',
      choices: [
        ['direct_microsite', 'Direct - microsite (6%)'],
        ['direct_marketplace', 'Direct - marketplace (10%)'],
      ],
      default: 'direct_microsite',
    },
    currency: { title: 'Currency', type: 'string', default: 'EUR' },
  },
  required: [],
});

export default PropertyBookingFormSchema;
