import type { ConfigType } from '@plone/registry';
import MessagingRoute from '../components/Messaging/MessagingRoute';
import { AssistantRoute } from '../components/Assistant';

/**
 * Register addon-level routes.
 *
 * /messaging       → conversation list
 * /messaging/*     → conversation detail (path-suffix is the Plone path of
 *                    the GuestConversation object)
 * /assistant       → editor-facing assistant chat (RAG Q&A with citations)
 *
 * MessagingRoute handles both messaging paths by branching on
 * window.location.pathname; we register one exact:false route per prefix.
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
    {
      path: '/assistant',
      component: AssistantRoute,
      exact: false,
    },
  ];
  return config;
}
