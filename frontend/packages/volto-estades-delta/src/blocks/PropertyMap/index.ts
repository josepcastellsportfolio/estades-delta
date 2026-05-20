import PropertyMapView from './PropertyMapView';
import PropertyMapEdit from './PropertyMapEdit';
import PropertyMapSchema from './schema';

export const PROPERTY_MAP_BLOCK_ID = 'propertyMap';

export const propertyMapBlock = {
  id: PROPERTY_MAP_BLOCK_ID,
  title: 'Property map',
  icon: undefined,
  group: 'estadesDelta',
  view: PropertyMapView,
  edit: PropertyMapEdit,
  blockSchema: PropertyMapSchema,
  restricted: false,
  mostUsed: false,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyMapBlock;
