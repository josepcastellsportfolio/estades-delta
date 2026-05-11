import PropertyBookingFormView from './PropertyBookingFormView';
import PropertyBookingFormEdit from './PropertyBookingFormEdit';
import PropertyBookingFormSchema from './schema';

export const PROPERTY_BOOKING_FORM_BLOCK_ID = 'propertyBookingForm';

export const propertyBookingFormBlock = {
  id: PROPERTY_BOOKING_FORM_BLOCK_ID,
  title: 'Property booking form',
  icon: undefined,
  group: 'estadesDelta',
  view: PropertyBookingFormView,
  edit: PropertyBookingFormEdit,
  blockSchema: PropertyBookingFormSchema,
  restricted: false,
  mostUsed: true,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyBookingFormBlock;
export type { PropertyBookingFormData } from './PropertyBookingFormView';
export { computeBookingTotal } from './pricing';
export type { PricingBreakdown, PricingInputs } from './pricing';
