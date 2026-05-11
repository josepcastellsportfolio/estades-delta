import PropertyGalleryView from './PropertyGalleryView';
import PropertyGalleryEdit from './PropertyGalleryEdit';
import PropertyGallerySchema from './schema';

export const PROPERTY_GALLERY_BLOCK_ID = 'propertyGallery';

export const propertyGalleryBlock = {
  id: PROPERTY_GALLERY_BLOCK_ID,
  title: 'Property gallery',
  icon: undefined,
  group: 'estadesDelta',
  view: PropertyGalleryView,
  edit: PropertyGalleryEdit,
  blockSchema: PropertyGallerySchema,
  restricted: false,
  mostUsed: false,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyGalleryBlock;
export type { PropertyGalleryData } from './PropertyGalleryView';
