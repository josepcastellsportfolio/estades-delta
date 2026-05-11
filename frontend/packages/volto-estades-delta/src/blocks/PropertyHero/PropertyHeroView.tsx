import React from "react";

export interface PropertyHeroData {
  "@type": "propertyHero";
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
  const bg = data.hero_image
    ? { backgroundImage: `url(${data.hero_image})` }
    : undefined;

  return (
    <section
      className={`block propertyHero ${className ?? ""}`}
      data-block-type="propertyHero"
      style={bg}
    >
      <div className="propertyHero__inner">
        {data.title ? <h1 className="propertyHero__title">{data.title}</h1> : null}
        {data.subtitle ? (
          <p className="propertyHero__subtitle">{data.subtitle}</p>
        ) : null}
        {typeof data.capacity === "number" ? (
          <p className="propertyHero__capacity">
            <strong>{data.capacity}</strong> guests max
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default PropertyHeroView;
