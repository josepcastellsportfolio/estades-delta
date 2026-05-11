import React from 'react';
import PropertyGalleryView, {
  type PropertyGalleryData,
} from './PropertyGalleryView';

interface EditProps {
  data: PropertyGalleryData;
  block: string;
  selected?: boolean;
  onChangeBlock: (block: string, data: PropertyGalleryData) => void;
}

const PropertyGalleryEdit: React.FC<EditProps> = ({ data }) => (
  <PropertyGalleryView data={data} />
);

export default PropertyGalleryEdit;
