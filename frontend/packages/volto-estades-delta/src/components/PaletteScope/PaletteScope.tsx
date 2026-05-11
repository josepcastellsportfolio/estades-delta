import React from 'react';
import {
  DEFAULT_PALETTE,
  PALETTES,
  type PaletteName,
} from '../../theme/tokens';

interface PaletteScopeProps extends React.HTMLAttributes<HTMLElement> {
  /** Selected palette. Falls back to `arrossar` if undefined or invalid. */
  palette?: PaletteName | string;
  /** Element type to render. Defaults to `div`. */
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}

function isValidPalette(value: unknown): value is PaletteName {
  return (
    typeof value === 'string' && (PALETTES as readonly string[]).includes(value)
  );
}

/**
 * PaletteScope sets `data-palette="…"` on its rendered element so that the CSS
 * custom properties defined in palettes.scss cascade down to all descendants.
 *
 * Usage:
 *   <PaletteScope palette="arrossar">    // marketplace master
 *     <Marketplace />
 *   </PaletteScope>
 *
 *   <PaletteScope palette={property.palette} as="article">
 *     <PropertyView />
 *   </PaletteScope>
 */
export const PaletteScope: React.FC<PaletteScopeProps> = ({
  palette,
  as: Tag = 'div',
  children,
  ...rest
}) => {
  const safePalette = isValidPalette(palette) ? palette : DEFAULT_PALETTE;
  const Element = Tag as React.ElementType;
  return (
    <Element data-palette={safePalette} {...rest}>
      {children}
    </Element>
  );
};

export default PaletteScope;
