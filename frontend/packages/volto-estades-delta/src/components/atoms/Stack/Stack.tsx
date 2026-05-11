import React from 'react';
import './Stack.scss';

export type StackDirection = 'horizontal' | 'vertical';
export type StackGap = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  direction?: StackDirection;
  gap?: StackGap;
  wrap?: boolean;
  align?: StackAlign;
  justify?: StackJustify;
  as?: 'div' | 'ul' | 'section' | 'nav';
  children?: React.ReactNode;
}

/**
 * Stack layout primitive. Flex wrapper with a gap-on-token scale so blocks
 * compose without `margin` cascades. Keep usage to layout-only — for visual
 * grouping with a border or surface, wrap in a <Card> instead.
 */
export const Stack: React.FC<StackProps> = ({
  direction = 'vertical',
  gap = 4,
  wrap = false,
  align,
  justify,
  as: Tag = 'div',
  className,
  children,
  ...rest
}) => {
  const cls = [
    'ed-stack',
    `ed-stack--${direction}`,
    `ed-stack--gap-${gap}`,
    wrap ? 'ed-stack--wrap' : null,
    align ? `ed-stack--align-${align}` : null,
    justify ? `ed-stack--justify-${justify}` : null,
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

export default Stack;
