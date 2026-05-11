import type { ConfigType } from "@plone/registry";
import propertyHeroBlock, {
  PROPERTY_HERO_BLOCK_ID,
} from "../blocks/PropertyHero";
import propertyDescriptionBlock, {
  PROPERTY_DESCRIPTION_BLOCK_ID,
} from "../blocks/PropertyDescription";

export default function installBlocks(config: ConfigType) {
  config.blocks.blocksConfig[PROPERTY_HERO_BLOCK_ID] = propertyHeroBlock;
  config.blocks.blocksConfig[PROPERTY_DESCRIPTION_BLOCK_ID] = propertyDescriptionBlock;

  config.blocks.groupBlocksOrder = [
    ...(config.blocks.groupBlocksOrder ?? []).filter(
      (g) => g.id !== "estadesDelta",
    ),
    { id: "estadesDelta", title: "Estades Delta" },
  ];

  return config;
}
