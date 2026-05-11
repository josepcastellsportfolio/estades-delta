import type { ConfigType } from '@plone/registry';
import { tenantRoutingMiddleware } from '../middleware/tenantRouting';

/**
 * Register Express middleware that runs inside Volto's SSR server. Volto looks
 * for `config.settings.expressMiddleware` (array) when assembling the server-side
 * app. We append our tenantRouting handler so per-property hostnames are
 * rewritten before Volto's main router sees them.
 */
export default function installMiddleware(config: ConfigType) {
  const current = (config.settings.expressMiddleware as unknown[]) || [];
  config.settings.expressMiddleware = [...current, tenantRoutingMiddleware()];
  return config;
}
