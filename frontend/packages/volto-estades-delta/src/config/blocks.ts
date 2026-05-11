import type { ConfigType } from '@plone/registry';
import propertyHeroBlock, {
  PROPERTY_HERO_BLOCK_ID,
} from '../blocks/PropertyHero';
import propertyDescriptionBlock, {
  PROPERTY_DESCRIPTION_BLOCK_ID,
} from '../blocks/PropertyDescription';
import propertyGalleryBlock, {
  PROPERTY_GALLERY_BLOCK_ID,
} from '../blocks/PropertyGallery';
import propertyAmenitiesBlock, {
  PROPERTY_AMENITIES_BLOCK_ID,
} from '../blocks/PropertyAmenities';
import propertyBookingFormBlock, {
  PROPERTY_BOOKING_FORM_BLOCK_ID,
} from '../blocks/PropertyBookingForm';
import aggregatorPropertyCardBlock, {
  AGGREGATOR_PROPERTY_CARD_BLOCK_ID,
} from '../blocks/AggregatorPropertyCard';

export default function installBlocks(config: ConfigType) {
  // Property-page blocks: hero, gallery, description, amenities, booking form.
  config.blocks.blocksConfig[PROPERTY_HERO_BLOCK_ID] = propertyHeroBlock;
  config.blocks.blocksConfig[PROPERTY_GALLERY_BLOCK_ID] = propertyGalleryBlock;
  config.blocks.blocksConfig[PROPERTY_DESCRIPTION_BLOCK_ID] =
    propertyDescriptionBlock;
  config.blocks.blocksConfig[PROPERTY_AMENITIES_BLOCK_ID] =
    propertyAmenitiesBlock;
  config.blocks.blocksConfig[PROPERTY_BOOKING_FORM_BLOCK_ID] =
    propertyBookingFormBlock;

  // Marketplace-aggregator-only block.
  config.blocks.blocksConfig[AGGREGATOR_PROPERTY_CARD_BLOCK_ID] =
    aggregatorPropertyCardBlock;

  config.blocks.groupBlocksOrder = [
    ...(config.blocks.groupBlocksOrder ?? []).filter(
      (g) => g.id !== 'estadesDelta',
    ),
    { id: 'estadesDelta', title: 'Estades Delta' },
  ];

  return config;
}
