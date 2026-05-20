import AggregatorPropertyListView from './AggregatorPropertyListView';
import AggregatorPropertyListEdit from './AggregatorPropertyListEdit';
import AggregatorPropertyListSchema from './schema';

export const AGGREGATOR_PROPERTY_LIST_BLOCK_ID = 'aggregatorPropertyList';

export const aggregatorPropertyListBlock = {
  id: AGGREGATOR_PROPERTY_LIST_BLOCK_ID,
  title: 'Aggregator property list',
  icon: undefined,
  group: 'estadesDelta',
  view: AggregatorPropertyListView,
  edit: AggregatorPropertyListEdit,
  blockSchema: AggregatorPropertyListSchema,
  restricted: false,
  mostUsed: true,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default aggregatorPropertyListBlock;
