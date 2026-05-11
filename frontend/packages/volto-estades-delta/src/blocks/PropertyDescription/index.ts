import PropertyDescriptionView from "./PropertyDescriptionView";
import PropertyDescriptionEdit from "./PropertyDescriptionEdit";
import PropertyDescriptionSchema from "./schema";

export const PROPERTY_DESCRIPTION_BLOCK_ID = "propertyDescription";

export const propertyDescriptionBlock = {
  id: PROPERTY_DESCRIPTION_BLOCK_ID,
  title: "Property description",
  icon: undefined,
  group: "estadesDelta",
  view: PropertyDescriptionView,
  edit: PropertyDescriptionEdit,
  blockSchema: PropertyDescriptionSchema,
  restricted: false,
  mostUsed: true,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyDescriptionBlock;
