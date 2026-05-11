import React from 'react';
import PropertyAmenitiesView, {
  type PropertyAmenitiesData,
} from './PropertyAmenitiesView';

interface EditProps {
  data: PropertyAmenitiesData;
  block: string;
  selected?: boolean;
  onChangeBlock: (block: string, data: PropertyAmenitiesData) => void;
}

const PropertyAmenitiesEdit: React.FC<EditProps> = ({ data }) => (
  <PropertyAmenitiesView data={data} />
);

export default PropertyAmenitiesEdit;
