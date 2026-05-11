import React from 'react';
import PropertyBookingFormView, {
  type PropertyBookingFormData,
} from './PropertyBookingFormView';

interface EditProps {
  data: PropertyBookingFormData;
  block: string;
  selected?: boolean;
  onChangeBlock: (block: string, data: PropertyBookingFormData) => void;
}

const PropertyBookingFormEdit: React.FC<EditProps> = ({ data }) => (
  <PropertyBookingFormView data={data} />
);

export default PropertyBookingFormEdit;
