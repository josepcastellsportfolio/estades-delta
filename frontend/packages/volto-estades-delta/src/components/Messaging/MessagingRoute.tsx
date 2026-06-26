/**
 * MessagingRoute — top-level route for /messaging[/<path>].
 *
 * Mounted via addonRoutes. Branches:
 *   - /messaging               → ConversationList
 *   - /messaging/<plone-path>  → ConversationDetail
 *
 * Navigation model:
 *   - List → Detail: history.pushState + dispatch 'ed-messaging-navigate'.
 *   - Detail → List: history.pushState + dispatch 'ed-messaging-navigate'.
 *   - Browser back/forward: popstate.
 * pushState does NOT fire popstate, so we dispatch a custom event for
 * intra-app navigation. Both listeners re-read window.location.pathname.
 *
 * We deliberately avoid react-router hooks because Volto's router setup
 * varies between major versions; keeping this self-contained makes the
 * addon portable across Volto 18 → 19 without churn.
 */
import React, { useCallback, useEffect, useState } from 'react';
import ConversationList from './ConversationList';
import ConversationDetail from './ConversationDetail';

const ROUTE_PREFIX = '/messaging';
export const NAVIGATE_EVENT = 'ed-messaging-navigate';

function readPathSuffix(): string {
  if (typeof window === 'undefined') return '';
  const { pathname } = window.location;
  if (!pathname.startsWith(ROUTE_PREFIX)) return '';
  const remainder = pathname.slice(ROUTE_PREFIX.length);
  return remainder.startsWith('/') ? remainder : '';
}

export function navigateMessaging(suffix: string): void {
  if (typeof window === 'undefined') return;
  const target = suffix ? `${ROUTE_PREFIX}${suffix}` : ROUTE_PREFIX;
  if (window.location.pathname === target) return;
  window.history.pushState({}, '', target);
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT));
}

const MessagingRoute: React.FC = () => {
  const [suffix, setSuffix] = useState<string>('');

  useEffect(() => {
    setSuffix(readPathSuffix());

    if (typeof window === 'undefined') return undefined;
    const sync = () => setSuffix(readPathSuffix());
    window.addEventListener('popstate', sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);

  const handleBack = useCallback(() => {
    navigateMessaging('');
  }, []);

  if (!suffix) {
    return <ConversationList />;
  }
  return <ConversationDetail conversationPath={suffix} onBack={handleBack} />;
};

export default MessagingRoute;
