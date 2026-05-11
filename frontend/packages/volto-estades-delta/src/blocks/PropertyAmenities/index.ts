import PropertyAmenitiesView from './PropertyAmenitiesView';
import PropertyAmenitiesEdit from './PropertyAmenitiesEdit';
import PropertyAmenitiesSchema from './schema';

export const PROPERTY_AMENITIES_BLOCK_ID = 'propertyAmenities';

export const propertyAmenitiesBlock = {
  id: PROPERTY_AMENITIES_BLOCK_ID,
  title: 'Property amenities',
  icon: undefined,
  group: 'estadesDelta',
  view: PropertyAmenitiesView,
  edit: PropertyAmenitiesEdit,
  blockSchema: PropertyAmenitiesSchema,
  restricted: false,
  mostUsed: false,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyAmenitiesBlock;
export type {
  PropertyAmenitiesData,
  PropertyAmenitiesGroup,
} from './PropertyAmenitiesView';
