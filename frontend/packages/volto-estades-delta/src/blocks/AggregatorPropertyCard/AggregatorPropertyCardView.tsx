import React from 'react';
import Card from '../../components/atoms/Card';
import Heading from '../../components/atoms/Heading';
import Pill from '../../components/atoms/Pill';
import Stack from '../../components/atoms/Stack';
import Price from '../../components/atoms/Price';
import Rating from '../../components/atoms/Rating';
import Button from '../../components/atoms/Button';
import './AggregatorPropertyCard.scss';

export interface AggregatorPropertyCardData {
  '@type': 'aggregatorPropertyCard';
  /** Canonical URL to the property microsite. */
  href?: string;
  title?: string;
  /** Municipality + zone, e.g. "Deltebre · Riumar". */
  location?: string;
  /** Hero image. Falls back to a placeholder block when empty. */
  image?: string;
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  /** Rating 0..5, fractional ok. */
  rating?: number;
  /** Total reviews count. */
  ratingCount?: number;
  /** "From" price in major units (e.g. 85 → 85€). */
  fromPrice?: number;
  currency?: string;
  locale?: string;
  /** Tag string shown in top-left over the image — e.g. "Destacat". */
  tag?: string;
}

interface ViewProps {
  data: AggregatorPropertyCardData;
  className?: string;
}

function fmtMeta(data: AggregatorPropertyCardData): string[] {
  const parts: string[] = [];
  if (typeof data.capacity === 'number') parts.push(`${data.capacity} hostes`);
  if (typeof data.bedrooms === 'number')
    parts.push(`${data.bedrooms} ${data.bedrooms === 1 ? 'hab' : 'hab'}`);
  if (typeof data.bathrooms === 'number') parts.push(`${data.bathrooms} banys`);
  return parts;
}

const AggregatorPropertyCardView: React.FC<ViewProps> = ({
  data,
  className,
}) => {
  const meta = fmtMeta(data);
  const heroStyle = data.image
    ? { backgroundImage: `url(${data.image})` }
    : undefined;

  return (
    <Card
      elevation={2}
      interactive
      className={`aggregatorPropertyCard ${className ?? ''}`}
      header={
        <div
          className="aggregatorPropertyCard__media"
          style={heroStyle}
          aria-label={data.title ?? 'property image'}
          role="img"
        >
          {data.image ? null : (
            <span className="aggregatorPropertyCard__media-placeholder">
              (sense imatge)
            </span>
          )}
          {data.tag ? (
            <div className="aggregatorPropertyCard__tag-row">
              <Pill tone="accent">{data.tag}</Pill>
            </div>
          ) : null}
        </div>
      }
      footer={
        <div className="aggregatorPropertyCard__footer">
          <div className="aggregatorPropertyCard__price-row">
            {typeof data.fromPrice === 'number' ? (
              <>
                <span className="aggregatorPropertyCard__price-prefix">
                  des de
                </span>
                <Price
                  amount={data.fromPrice}
                  currency={data.currency ?? 'EUR'}
                  locale={data.locale ?? 'ca-ES'}
                  suffix="/ nit"
                  size="lg"
                />
              </>
            ) : null}
          </div>
          {data.href ? (
            <Button as="a" variant="secondary" size="sm" href={data.href}>
              Veure
            </Button>
          ) : null}
        </div>
      }
    >
      <Stack direction="vertical" gap={2}>
        {data.title ? <Heading level={3}>{data.title}</Heading> : null}
        {data.location ? (
          <span
            style={{
              color: 'var(--ed-color-text-muted)',
              fontFamily: 'var(--ed-font-body)',
              fontSize: 'var(--ed-font-size-sm)',
            }}
          >
            {data.location}
          </span>
        ) : null}
        {meta.length > 0 ? (
          <div className="aggregatorPropertyCard__meta">
            {meta.map((part, i) => (
              <React.Fragment key={part}>
                {i > 0 ? (
                  <span className="aggregatorPropertyCard__meta-separator">
                    ·
                  </span>
                ) : null}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>
        ) : null}
        {typeof data.rating === 'number' ? (
          <Rating value={data.rating} count={data.ratingCount} size="sm" />
        ) : null}
      </Stack>
    </Card>
  );
};

export default AggregatorPropertyCardView;
