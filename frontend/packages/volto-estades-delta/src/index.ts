import type { ConfigType } from '@plone/registry';
import installSettings from './config/settings';
import installBlocks from './config/blocks';
import installMiddleware from './config/middleware';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);
  installMiddleware(config);

  return config;
}

export default applyConfig;
