import React from 'react';
import './Heading.scss';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingTone = 'primary' | 'secondary' | 'muted' | 'inverse';
export type HeadingSize = '2xl' | 'xl' | 'lg';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic heading level. */
  level: HeadingLevel;
  /** Optional tone override (defaults to text-primary). */
  tone?: HeadingTone;
  /**
   * Decorative oversized variant — only applicable to level 1 hero copy.
   * Overrides the default level-1 size.
   */
  decorative?: boolean;
  /** Force a custom size token regardless of level. */
  size?: HeadingSize;
  children?: React.ReactNode;
}

/**
 * Heading wraps `h1`–`h6` so the typography hierarchy from `reset.scss`
 * applies, while exposing the standard tone / decorative knobs. For all
 * non-hero copy, use the matching `level` and let the reset do the work.
 */
export const Heading: React.FC<HeadingProps> = ({
  level,
  tone,
  decorative = false,
  size,
  className,
  children,
  ...rest
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const cls = [
    'ed-heading',
    tone ? `ed-heading--tone-${tone}` : null,
    decorative ? 'ed-heading--decorative' : null,
    size ? `ed-heading--size-${size}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const Element = Tag as React.ElementType;
  return (
    <Element className={cls} {...rest}>
      {children}
    </Element>
  );
};

export default Heading;
