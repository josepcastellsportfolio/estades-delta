import React from 'react';
import './Pill.scss';

export type PillTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /** Outline variant for primary/secondary/accent. */
  outline?: boolean;
  /** Optional leading icon node — accepts emoji or SVG. */
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Pill / chip / tag. Used for amenities, statuses, source labels, etc.
 * Palette-agnostic; the `tone` prop maps to CSS variables only.
 */
export const Pill: React.FC<PillProps> = ({
  tone = 'neutral',
  outline = false,
  icon,
  className,
  children,
  ...rest
}) => {
  const cls = [
    'ed-pill',
    `ed-pill--${tone}`,
    outline ? 'ed-pill--outline' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} {...rest}>
      {icon}
      {children}
    </span>
  );
};

export default Pill;
