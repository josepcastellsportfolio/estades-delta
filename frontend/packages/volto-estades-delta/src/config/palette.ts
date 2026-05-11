import type { ConfigType } from '@plone/registry';
import { DEFAULT_PALETTE } from '../theme/tokens';

/**
 * Make sure the marketplace root (and any page rendered before the
 * PropertyView component decides on a per-tenant palette) starts with the
 * Arrossar master palette. We do this by setting `data-palette` on the
 * `<body>` from the server side via Volto's `htmlBodyAttributes` hook.
 *
 * When a PropertyView mounts, it wraps its subtree in <PaletteScope
 * palette={property.palette}/> which overrides the body-level value for that
 * subtree via the CSS variable cascade.
 */
export default function installPalette(config: ConfigType) {
  const existing =
    ((config.settings as Record<string, unknown>).htmlBodyAttributes as Record<
      string,
      unknown
    >) || {};
  (config.settings as Record<string, unknown>).htmlBodyAttributes = {
    ...existing,
    'data-palette': DEFAULT_PALETTE,
  };
  return config;
}
