import PropertyCalendarView from './PropertyCalendarView';
import PropertyCalendarEdit from './PropertyCalendarEdit';
import PropertyCalendarSchema from './schema';

export const PROPERTY_CALENDAR_BLOCK_ID = 'propertyCalendar';

export const propertyCalendarBlock = {
  id: PROPERTY_CALENDAR_BLOCK_ID,
  title: 'Property calendar',
  icon: undefined,
  group: 'estadesDelta',
  view: PropertyCalendarView,
  edit: PropertyCalendarEdit,
  blockSchema: PropertyCalendarSchema,
  restricted: false,
  mostUsed: false,
  sidebarTab: 1,
  security: { addPermission: [], view: [] },
};

export default propertyCalendarBlock;
