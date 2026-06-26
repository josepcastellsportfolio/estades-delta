import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import installMiddleware from './config/middleware';
import installPalette from './config/palette';
import installViews from './config/views';
import installRoutes from './config/routes';

// Importing the entry .scss once at addon load registers all design tokens,
// palette custom properties, font @imports, and the typography reset on the
// resulting Webpack CSS bundle. Volto's build pipeline picks this up because
// the addon is listed in the parent volto.config.js `addons` array.
import './theme/index.scss';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);
  installViews(config);
  installRoutes(config);
  installMiddleware(config);
  installPalette(config);

  return config;
}

export default applyConfig;
