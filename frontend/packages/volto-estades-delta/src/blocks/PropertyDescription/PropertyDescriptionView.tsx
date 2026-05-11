import React from 'react';
import Heading from '../../components/atoms/Heading';
import Stack from '../../components/atoms/Stack';
import './PropertyDescription.scss';

export interface PropertyDescriptionData {
  '@type': 'propertyDescription';
  heading?: string;
  body?: string;
}

interface ViewProps {
  data: PropertyDescriptionData;
  className?: string;
}

const PropertyDescriptionView: React.FC<ViewProps> = ({ data, className }) => (
  <section
    className={`block propertyDescription ${className ?? ''}`}
    data-block-type="propertyDescription"
  >
    <Stack direction="vertical" gap={4}>
      {data.heading ? <Heading level={2}>{data.heading}</Heading> : null}
      {data.body ? <p className="propertyDescription__body">{data.body}</p> : null}
    </Stack>
  </section>
);

export default PropertyDescriptionView;
