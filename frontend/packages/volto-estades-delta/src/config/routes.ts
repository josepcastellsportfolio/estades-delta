import type { ConfigType } from '@plone/registry';
import MessagingRoute from '../components/Messaging/MessagingRoute';

/**
 * Register addon-level routes.
 *
 * /messaging       → conversation list
 * /messaging/*     → conversation detail (path-suffix is the Plone path of
 *                    the GuestConversation object)
 *
 * The same component handles both — it branches on window.location.pathname.
 * We register a single exact:false route to capture the prefix.
 */
export default function installRoutes(config: ConfigType) {
  if (!Array.isArray(config.addonRoutes)) {
    config.addonRoutes = [];
  }
  config.addonRoutes = [
    ...config.addonRoutes,
    {
      path: '/messaging',
      component: MessagingRoute,
      exact: false,
    },
  ];
  return config;
}
