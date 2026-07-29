import type { ConfigType } from '@plone/registry';
import MessagingRoute from '../components/Messaging/MessagingRoute';

/**
 * Register addon-level routes.
 *
 * /messaging       → conversation list
 * /messaging/*     → conversation detail (path-suffix is the Plone path of
 *                    the GuestConversation object)
 *
 * MessagingRoute handles both messaging paths by branching on
 * window.location.pathname; we register one exact:false route per prefix.
 *
 * The assistant is NOT a route — it's a floating widget mounted via appExtras
 * (see config/assistant.ts) that appears on property microsites for guests.
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
