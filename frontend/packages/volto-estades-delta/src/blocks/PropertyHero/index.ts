import PropertyHeroView from "./PropertyHeroView";
import PropertyHeroEdit from "./PropertyHeroEdit";
import PropertyHeroSchema from "./schema";

export const PROPERTY_HERO_BLOCK_ID = "propertyHero";

export const propertyHeroBlock = {
  id: PROPERTY_HERO_BLOCK_ID,
  title: "Property hero",
  icon: undefined,
  group: "estadesDelta",
  view: PropertyHeroView,
  edit: PropertyHeroEdit,
  blockSchema: PropertyHeroSchema,
  restricted: false,
  mostUsed: true,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyHeroBlock;
