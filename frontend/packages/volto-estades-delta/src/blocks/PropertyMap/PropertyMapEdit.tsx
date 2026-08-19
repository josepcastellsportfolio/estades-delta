/**
 * PropertyMap — Edit component (CMS backend mode).
 *
 * Renders the live map in edit mode too so editors can see the pin. Falls
 * back to a placeholder if no coordinates are configured yet.
 */
import React from 'react';
import PropertyMapView from './PropertyMapView';
import BlockSidebar from '../../components/BlockSidebar';
import PropertyMapSchema from './schema';
import type { PropertyMapData } from './schema';

interface PropertyMapEditProps {
  data: PropertyMapData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: any;
  selected?: boolean;
}

const PropertyMapEdit: React.FC<PropertyMapEditProps> = (props) => {
  const { data, content, selected } = props;
  return (
    <>
      <div style={{ opacity: selected ? 1 : 0.85 }}>
        <PropertyMapView data={data} content={content} />
      </div>
      <BlockSidebar {...props} schema={PropertyMapSchema} />
    </>
  );
};

export default PropertyMapEdit;
