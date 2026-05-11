import AggregatorPropertyCardView from './AggregatorPropertyCardView';
import AggregatorPropertyCardEdit from './AggregatorPropertyCardEdit';
import AggregatorPropertyCardSchema from './schema';

export const AGGREGATOR_PROPERTY_CARD_BLOCK_ID = 'aggregatorPropertyCard';

export const aggregatorPropertyCardBlock = {
  id: AGGREGATOR_PROPERTY_CARD_BLOCK_ID,
  title: 'Aggregator property card',
  icon: undefined,
  group: 'estadesDelta',
  view: AggregatorPropertyCardView,
  edit: AggregatorPropertyCardEdit,
  blockSchema: AggregatorPropertyCardSchema,
  restricted: false,
  mostUsed: false,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default aggregatorPropertyCardBlock;
export type { AggregatorPropertyCardData } from './AggregatorPropertyCardView';
