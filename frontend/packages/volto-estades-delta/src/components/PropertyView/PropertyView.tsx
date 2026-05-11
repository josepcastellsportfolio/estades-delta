import React from 'react';
import PaletteScope from '../PaletteScope';
import Heading from '../atoms/Heading';
import Stack from '../atoms/Stack';
import Pill from '../atoms/Pill';
import PropertyGalleryView from '../../blocks/PropertyGallery/PropertyGalleryView';
import PropertyDescriptionView from '../../blocks/PropertyDescription/PropertyDescriptionView';
import PropertyAmenitiesView from '../../blocks/PropertyAmenities/PropertyAmenitiesView';
import PropertyBookingFormView from '../../blocks/PropertyBookingForm/PropertyBookingFormView';
import './PropertyView.scss';

/**
 * Shape of the Plone `Property` content type as it arrives from the REST API.
 * Kept loose because the typings get mixed with vocabulary tokens (the
 * `palette` field comes back as `{ title, token }`).
 */
export interface PropertyContent {
  '@id'?: string;
  '@type'?: 'Property';
  title?: string;
  subtitle?: string;
  short_name?: string;
  description?: string;
  long_description?: { data?: string } | string;
  municipality?: string;
  zone?: string;
  max_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[] | string;
  base_price_low_season?: number;
  base_price_mid_season?: number;
  base_price_high_season?: number;
  cleaning_fee?: number;
  tourist_tax_per_night?: number;
  // Vocabularies come through as `{title, token}` shapes via Plone REST API.
  palette?: { token?: string } | string;
}

interface PropertyViewProps {
  content: PropertyContent;
  /** Standard Volto-passed props are intentionally narrowed: we only care
   *  about `content`. The rest is forwarded by AppRouter but not used here. */
}

function getPaletteToken(palette: PropertyContent['palette']): string {
  if (!palette) return 'arrossar';
  if (typeof palette === 'string') return palette;
  return palette.token ?? 'arrossar';
}

function joinMeta(parts: Array<string | number | undefined>): string[] {
  return parts
    .filter((p) => p !== undefined && p !== null && p !== '')
    .map(String);
}

const PropertyView: React.FC<PropertyViewProps> = ({ content }) => {
  const paletteToken = getPaletteToken(content.palette);
  const longDescription =
    typeof content.long_description === 'string'
      ? content.long_description
      : content.long_description?.data ?? '';
  const description = content.description ?? '';
  const bodyText = longDescription || description;

  const headerMeta = joinMeta([content.municipality, content.zone]).join(' · ');

  const facts = joinMeta([
    content.max_guests ? `${content.max_guests} hostes` : undefined,
    content.bedrooms ? `${content.bedrooms} hab` : undefined,
    content.bathrooms ? `${content.bathrooms} banys` : undefined,
  ]);

  return (
    <PaletteScope palette={paletteToken} as="article" className="propertyView">
      <div className="propertyView__container">
        <header className="propertyView__header">
          <Heading level={1} decorative>
            {content.title ?? 'Propietat'}
          </Heading>
          {content.subtitle ? (
            <p
              style={{
                fontFamily: 'var(--ed-font-body)',
                fontSize: 'var(--ed-font-size-lg)',
                color: 'var(--ed-color-text-secondary)',
                margin: 0,
              }}
            >
              {content.subtitle}
            </p>
          ) : null}
          {headerMeta ? (
            <div className="propertyView__meta">{headerMeta}</div>
          ) : null}
          {facts.length > 0 ? (
            <Stack direction="horizontal" gap={2} wrap>
              {facts.map((f) => (
                <Pill key={f}>{f}</Pill>
              ))}
            </Stack>
          ) : null}
        </header>

        <PropertyGalleryView
          data={{
            '@type': 'propertyGallery',
            alt: content.title,
          }}
        />

        <div className="propertyView__main">
          <div className="propertyView__blocks">
            {bodyText ? (
              <PropertyDescriptionView
                data={{
                  '@type': 'propertyDescription',
                  heading: 'Sobre la propietat',
                  body: bodyText,
                }}
              />
            ) : null}

            {content.amenities ? (
              <PropertyAmenitiesView
                data={{
                  '@type': 'propertyAmenities',
                  heading: 'Comoditats',
                  items: content.amenities,
                }}
              />
            ) : null}
          </div>

          <aside className="propertyView__aside">
            <PropertyBookingFormView
              data={{
                '@type': 'propertyBookingForm',
                heading: 'Reserva',
                basePriceLowSeason: content.base_price_low_season ?? 0,
                basePriceMidSeason: content.base_price_mid_season ?? 0,
                basePriceHighSeason: content.base_price_high_season ?? 0,
                cleaningFee: content.cleaning_fee,
                touristTaxPerNight: content.tourist_tax_per_night,
                maxGuests: content.max_guests,
                source: 'direct_microsite',
              }}
            />
          </aside>
        </div>
      </div>
    </PaletteScope>
  );
};

export default PropertyView;
