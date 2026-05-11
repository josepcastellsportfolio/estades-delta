import React from 'react';
import './Card.scss';

export type CardElevation = 0 | 1 | 2 | 3;

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  elevation?: CardElevation;
  /** Hover-lift state. Adds cursor:pointer + transform on hover. */
  interactive?: boolean;
  /** Element tag — `article` for self-contained, `section` for fragments. */
  as?: 'article' | 'section' | 'div';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Card primitive. Header / body / footer slots — when only `children` is
 * supplied, we use a single padded body. Surfaces follow the active palette
 * via CSS custom properties (no per-palette overrides needed).
 */
export const Card: React.FC<CardProps> = ({
  elevation = 1,
  interactive = false,
  as: Tag = 'article',
  header,
  footer,
  className,
  children,
  ...rest
}) => {
  const classes = [
    'ed-card',
    `ed-card--elevation-${elevation}`,
    interactive ? 'ed-card--interactive' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Element = Tag as React.ElementType;
  return (
    <Element className={classes} {...rest}>
      {header ? <div className="ed-card__header">{header}</div> : null}
      <div className="ed-card__body">{children}</div>
      {footer ? <div className="ed-card__footer">{footer}</div> : null}
    </Element>
  );
};

export default Card;
