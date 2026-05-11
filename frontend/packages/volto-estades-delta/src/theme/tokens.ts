/**
 * Mirror of the design tokens defined in tokens.scss + palettes.scss, exported
 * so components can read values from JS where computed styling is needed.
 *
 * NEVER use these in CSS — always reference the CSS custom property
 * (e.g. `var(--ed-color-primary-default)`). The JS export is for runtime logic
 * such as conditional styling, JS animations, or external libraries that
 * cannot consume CSS variables (e.g. legacy chart libraries).
 */

export const PALETTES = ['arrossar', 'riu-i-mar', 'capvespre'] as const;
export type PaletteName = (typeof PALETTES)[number];
export const DEFAULT_PALETTE: PaletteName = 'arrossar';

export const SPACING = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '6': 24,
  '8': 32,
  '12': 48,
  '16': 64,
  '24': 96,
  '32': 128,
  '48': 192,
  '64': 256,
} as const;

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export const FONT_FAMILY = {
  display: "'DM Serif Display', Georgia, serif",
  body: "'DM Sans', -apple-system, system-ui, sans-serif",
} as const;
