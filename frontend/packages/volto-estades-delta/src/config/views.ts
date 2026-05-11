import type { ConfigType } from '@plone/registry';
import PropertyView from '../components/PropertyView';

/**
 * Register the custom view for the `Property` content type so visiting
 * `/josep-test/casa-demo-riumar` (or the microsite hostname that rewrites to
 * it) renders our boutique PropertyView template instead of the default
 * Volto DocumentView.
 *
 * PropertyView reads the palette token off `content.palette` and wraps the
 * subtree in <PaletteScope/> so all child blocks inherit the correct theme.
 */
export default function installViews(config: ConfigType) {
  const settings = config.views as Record<string, Record<string, unknown>>;
  if (!settings.contentTypesViews) settings.contentTypesViews = {};
  settings.contentTypesViews.Property = PropertyView;
  return config;
}
