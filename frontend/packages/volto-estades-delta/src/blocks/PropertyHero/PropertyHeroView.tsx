import React from 'react';
import Heading from '../../components/atoms/Heading';
import Stack from '../../components/atoms/Stack';
import Pill from '../../components/atoms/Pill';
import './PropertyHero.scss';

export interface PropertyHeroData {
  '@type': 'propertyHero';
  title?: string;
  subtitle?: string;
  hero_image?: string;
  capacity?: number;
}

interface ViewProps {
  data: PropertyHeroData;
  className?: string;
}

const PropertyHeroView: React.FC<ViewProps> = ({ data, className }) => {
  const withImage = Boolean(data.hero_image);
  const style = withImage
    ? { backgroundImage: `url(${data.hero_image})` }
    : undefined;

  return (
    <section
      className={`block propertyHero ${className ?? ''}`}
      data-block-type="propertyHero"
      data-with-image={withImage ? 'true' : 'false'}
      style={style}
    >
      <div className="propertyHero__inner">
        <Stack direction="vertical" gap={3}>
          {data.title ? (
            <Heading level={1} decorative>
              {data.title}
            </Heading>
          ) : null}
          {data.subtitle ? (
            <p className="propertyHero__subtitle">{data.subtitle}</p>
          ) : null}
          {typeof data.capacity === 'number' ? (
            <Stack direction="horizontal" gap={2} wrap>
              <Pill tone={withImage ? 'accent' : 'primary'}>
                {data.capacity} hostes
              </Pill>
            </Stack>
          ) : null}
        </Stack>
      </div>
    </section>
  );
};

export default PropertyHeroView;
