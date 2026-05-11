import React from 'react';
import PropertyHeroView, { type PropertyHeroData } from './PropertyHeroView';

interface EditProps {
  data: PropertyHeroData;
  block: string;
  selected?: boolean;
  onChangeBlock: (block: string, data: PropertyHeroData) => void;
}

const PropertyHeroEdit: React.FC<EditProps> = (props) => {
  // Use the view as a live preview. Field editing happens in the sidebar via the
  // schema registered in `schema.ts`.
  return <PropertyHeroView data={props.data} />;
};

export default PropertyHeroEdit;
