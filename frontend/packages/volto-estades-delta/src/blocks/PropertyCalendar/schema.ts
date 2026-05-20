/**
 * PropertyCalendar block schema.
 *
 * Renders a static availability calendar. In Fase 1 the unavailable-dates
 * data is mock content provided either via the block schema (`unavailableDates`)
 * or via the parent Plone content object (Day 5+ when Beds24 sync is wired).
 */
export interface PropertyCalendarData {
  '@type': 'propertyCalendar';
  /** Optional heading shown above the calendar. */
  heading?: string;
  /** Number of months to display side-by-side. 1 or 2 (default 2). */
  monthsToShow?: number;
  /**
   * Mock unavailability data. Each entry is a YYYY-MM-DD date string.
   * Day 5+ this will come from `content.unavailable_dates` populated by the
   * Beds24 sync adapter; for now it's an editorial knob.
   */
  unavailableDates?: string[];
}

const PropertyCalendarSchema = {
  title: 'Property calendar',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['heading', 'monthsToShow', 'unavailableDates'],
    },
  ],
  properties: {
    heading: {
      title: 'Heading',
      description: 'Optional heading shown above the calendar.',
      type: 'string',
    },
    monthsToShow: {
      title: 'Months to show',
      description: 'How many months to render side-by-side. 1 or 2.',
      type: 'integer',
      minimum: 1,
      maximum: 2,
    },
    unavailableDates: {
      title: 'Unavailable dates (mock)',
      description:
        'YYYY-MM-DD entries marked as unavailable. Day 5+ this will be sourced from Beds24.',
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [],
};

export default PropertyCalendarSchema;
