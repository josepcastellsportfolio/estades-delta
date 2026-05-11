import React, { useEffect } from 'react';
import { DEFAULT_PALETTE } from '../../theme/tokens';

/**
 * Marketplace boot: ensure `<body data-palette="arrossar">` once the React
 * tree has mounted on the client. We do it via `useEffect` rather than a
 * Helmet `bodyAttributes` prop because Volto's bundled Helmet wrapper does
 * not flush body attributes on SSR consistently for custom `data-*` keys.
 *
 * SSR is still safe: the `:root` fallback in `palettes.scss` already mirrors
 * the Arrossar palette tokens, so the first paint shows correct colours
 * even before this effect runs. The effect just makes the cascade explicit
 * for DevTools and for any downstream selector that targets
 * `[data-palette]` directly.
 *
 * PropertyView and other tenant-specific subtrees override the cascade via
 * <PaletteScope palette={...}> wrappers, not by mutating the body again.
 */
const MarketplaceBodyPalette: React.FC = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previous = document.body.getAttribute('data-palette');
    document.body.setAttribute('data-palette', DEFAULT_PALETTE);
    return () => {
      // Restore the previous value (or remove the attribute) on unmount so
      // unit tests and hot-reload don't leave stale state behind.
      if (previous === null) document.body.removeAttribute('data-palette');
      else document.body.setAttribute('data-palette', previous);
    };
  }, []);
  return null;
};

export default MarketplaceBodyPalette;
