import React from "react";
import PropertyDescriptionView, {
  type PropertyDescriptionData,
} from "./PropertyDescriptionView";

interface EditProps {
  data: PropertyDescriptionData;
  block: string;
  selected?: boolean;
  onChangeBlock: (block: string, data: PropertyDescriptionData) => void;
}

const PropertyDescriptionEdit: React.FC<EditProps> = (props) => (
  <PropertyDescriptionView data={props.data} />
);

export default PropertyDescriptionEdit;
