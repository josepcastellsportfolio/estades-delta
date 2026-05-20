import AggregatorFiltersView from './AggregatorFiltersView';
import AggregatorFiltersEdit from './AggregatorFiltersEdit';
import AggregatorFiltersSchema from './schema';

export const AGGREGATOR_FILTERS_BLOCK_ID = 'aggregatorFilters';

export const aggregatorFiltersBlock = {
  id: AGGREGATOR_FILTERS_BLOCK_ID,
  title: 'Aggregator filters',
  icon: undefined,
  group: 'estadesDelta',
  view: AggregatorFiltersView,
  edit: AggregatorFiltersEdit,
  blockSchema: AggregatorFiltersSchema,
  restricted: false,
  mostUsed: true,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default aggregatorFiltersBlock;
