/**
 * Atoms barrel. Re-export everything in alphabetical order so consumers can
 * `import { Button, Card, Pill, ... } from 'volto-estades-delta/atoms'`.
 *
 * Atom rules (enforced by code review, not lint):
 *   - Palette-agnostic. Every colour comes from a `--ed-*` CSS variable;
 *     never from a hardcoded hex.
 *   - No data fetching, no Redux, no router. Pure UI.
 *   - One <Component>/<Component>.scss/<Component>.test.tsx triplet per atom.
 *   - Stories live next to the component as <Component>.stories.tsx.
 */
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Card } from './Card';
export type { CardProps, CardElevation } from './Card';

export { default as Heading } from './Heading';
export type {
  HeadingProps,
  HeadingLevel,
  HeadingTone,
  HeadingSize,
} from './Heading';

export { default as Pill } from './Pill';
export type { PillProps, PillTone } from './Pill';

export { default as Price } from './Price';
export type { PriceProps, PriceSize } from './Price';

export { default as Rating } from './Rating';
export type { RatingProps, RatingSize } from './Rating';

export { default as Stack } from './Stack';
export type {
  StackProps,
  StackDirection,
  StackGap,
  StackAlign,
  StackJustify,
} from './Stack';
