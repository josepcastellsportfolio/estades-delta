/**
 * PropertyCalendar — Edit component (CMS backend mode).
 *
 * Renders the live calendar in edit mode so editors can sanity-check the
 * unavailable-dates field they're adding via the schema. pointer-events
 * disabled so navigation buttons don't fire during edit.
 */
import React from 'react';
import PropertyCalendarView from './PropertyCalendarView';
import BlockSidebar from '../../components/BlockSidebar';
import PropertyCalendarSchema from './schema';
import type { PropertyCalendarData } from './schema';

interface PropertyCalendarEditProps {
  data: PropertyCalendarData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: any;
  selected?: boolean;
}

const PropertyCalendarEdit: React.FC<PropertyCalendarEditProps> = (props) => {
  const { data, content, selected } = props;
  return (
    <>
      <div style={{ opacity: selected ? 1 : 0.85, pointerEvents: 'none' }}>
        <PropertyCalendarView data={data} content={content} />
      </div>
      <BlockSidebar {...props} schema={PropertyCalendarSchema} />
    </>
  );
};

export default PropertyCalendarEdit;
