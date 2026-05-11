import React from 'react';
import './PropertyGallery.scss';

export interface PropertyGalleryData {
  '@type': 'propertyGallery';
  /** Hero / large image URL. */
  hero?: string;
  /** Up to 4 secondary images for the 2x2 grid. */
  images?: string[];
  /**
   * Total number of photos available — when greater than what we render,
   * the last cell shows a "+N more" overlay.
   */
  total?: number;
  /** Alt text for the hero image (and prefix for the rest). */
  alt?: string;
}

interface ViewProps {
  data: PropertyGalleryData;
  className?: string;
  /** Optional click handler for opening a lightbox upstream. */
  onOpen?: (index: number) => void;
}

const MAX_SECONDARY = 4;

const cellStyle = (src?: string): React.CSSProperties | undefined =>
  src ? { backgroundImage: `url(${src})` } : undefined;

const PropertyGalleryView: React.FC<ViewProps> = ({
  data,
  className,
  onOpen,
}) => {
  const secondary = (data.images ?? []).slice(0, MAX_SECONDARY);
  const visibleCount = (data.hero ? 1 : 0) + secondary.length;
  const total = typeof data.total === 'number' ? data.total : visibleCount;
  const moreCount = Math.max(0, total - visibleCount);

  const handleClick = (i: number) => () => onOpen?.(i);

  return (
    <section
      className={`block propertyGallery ${className ?? ''}`}
      data-block-type="propertyGallery"
      aria-label={data.alt ?? 'property gallery'}
    >
      <div
        className="propertyGallery__cell propertyGallery__cell--hero"
        style={cellStyle(data.hero)}
        onClick={handleClick(0)}
        role={data.hero ? 'button' : undefined}
        aria-label={data.alt ?? 'hero image'}
      >
        {data.hero ? null : (
          <span className="propertyGallery__cell-placeholder">
            (sense imatge)
          </span>
        )}
      </div>

      {secondary.map((src, i) => {
        const isLast = i === secondary.length - 1;
        const showOverlay = isLast && moreCount > 0;
        return (
          <div
            key={`${src}-${i}`}
            className="propertyGallery__cell"
            style={cellStyle(src)}
            onClick={handleClick(i + 1)}
            role="button"
            aria-label={`${data.alt ?? 'gallery image'} ${i + 2}`}
          >
            {showOverlay ? (
              <span className="propertyGallery__count-overlay">
                + {moreCount} més
              </span>
            ) : null}
          </div>
        );
      })}

      {Array.from({
        length: Math.max(0, MAX_SECONDARY - secondary.length),
      }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="propertyGallery__cell"
          aria-hidden="true"
        >
          <span className="propertyGallery__cell-placeholder">
            (sense imatge)
          </span>
        </div>
      ))}
    </section>
  );
};

export default PropertyGalleryView;
