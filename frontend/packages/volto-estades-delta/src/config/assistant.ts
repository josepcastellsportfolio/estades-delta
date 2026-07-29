import type { ConfigType } from '@plone/registry';
import { AssistantWidget } from '../components/Assistant';

/**
 * Mount the floating assistant widget via Volto's appExtras slot.
 *
 * Registered site-wide (path "/"), but AssistantWidget renders null unless the
 * current content is a Property — so in practice it only appears on property
 * microsites, where a visitor can chat about the property they're viewing.
 * Same mechanism as installPalette; a React component rendered inside
 * <AppExtras> at App level (outside PropertyView's PaletteScope, so the panel
 * wraps itself in its own PaletteScope for the property colour).
 */
export default function installAssistant(config: ConfigType) {
  const settings = config.settings as Record<string, unknown>;
  const existing = (settings.appExtras as unknown[]) || [];
  settings.appExtras = [
    ...existing,
    {
      match: { path: '/', exact: false, strict: false },
      component: AssistantWidget,
    },
  ];
  return config;
}
