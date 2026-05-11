import React from 'react';
import './Rating.scss';

export type RatingSize = 'sm' | 'md' | 'lg';

export interface RatingProps {
  /** 0..max score, supports fractional. */
  value: number;
  /** Max score (number of stars). Default 5. */
  max?: number;
  /** Optional total reviews count. */
  count?: number;
  /** Show the numeric score next to the stars. Default true. */
  showScore?: boolean;
  size?: RatingSize;
  /**
   * Glyph for one star. Defaults to a black star; consumers can swap for an
   * SVG/icon component if they import one — but the default keeps this atom
   * dependency-free.
   */
  glyph?: string;
}

/**
 * Read-only rating display. We render a five-star background row and overlay
 * a clipped foreground row whose width is the percentage `value/max`. That
 * gives fractional stars without an icon library and without per-fraction
 * artwork.
 */
export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  count,
  showScore = true,
  size = 'md',
  glyph = '★',
}) => {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = (clamped / max) * 100;
  const stars = glyph.repeat(max);
  const cls = ['ed-rating', `ed-rating--size-${size}`].join(' ');
  const a11y = `${clamped.toFixed(1)} de ${max}`;

  return (
    <span className={cls} role="img" aria-label={a11y}>
      <span className="ed-rating__stars" aria-hidden="true">
        <span className="ed-rating__stars-bg">{stars}</span>
        <span className="ed-rating__stars-fg" style={{ width: `${pct}%` }}>
          {stars}
        </span>
      </span>
      {showScore && (
        <span className="ed-rating__score">{clamped.toFixed(1)}</span>
      )}
      {typeof count === 'number' && (
        <span className="ed-rating__count">({count})</span>
      )}
    </span>
  );
};

export default Rating;
