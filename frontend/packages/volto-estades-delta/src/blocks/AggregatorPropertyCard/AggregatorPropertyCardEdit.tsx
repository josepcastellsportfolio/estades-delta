import React from 'react';
import AggregatorPropertyCardView, {
  type AggregatorPropertyCardData,
} from './AggregatorPropertyCardView';

interface EditProps {
  data: AggregatorPropertyCardData;
  block: string;
  selected?: boolean;
  onChangeBlock: (block: string, data: AggregatorPropertyCardData) => void;
}

const AggregatorPropertyCardEdit: React.FC<EditProps> = ({ data }) => (
  <AggregatorPropertyCardView data={data} />
);

export default AggregatorPropertyCardEdit;
