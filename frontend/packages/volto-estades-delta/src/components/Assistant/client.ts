/**
 * Assistant client for Volto — wraps the shared engine's HttpAssistantClient,
 * pointed at Plone's same-origin @assistant-chat proxy.
 *
 * Auth: the browser's Plone cookie rides along via credentials:'same-origin'
 * (same as the Messaging api.ts pattern) — no token handling in JS. Plone
 * proxies the turn to the assistant service with the service token server-side.
 */
import { HttpAssistantClient } from '@stellifyit/assistant-ui-engine';

/**
 * A fresh client per conversation (it threads session_id internally).
 * `sourceUid` scopes every turn's RAG to the property being viewed.
 */
export function createAssistantClient(sourceUid?: string): HttpAssistantClient {
  return new HttpAssistantClient({
    chatPath: '/++api++/@assistant-chat',
    credentials: 'same-origin',
    sourceUid,
  });
}
