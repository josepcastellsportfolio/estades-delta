import React from 'react';

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
    {data.heading ? (
      <h2 className="propertyDescription__heading">{data.heading}</h2>
    ) : null}
    {data.body ? (
      <p className="propertyDescription__body">{data.body}</p>
    ) : null}
  </section>
);

export default PropertyDescriptionView;
