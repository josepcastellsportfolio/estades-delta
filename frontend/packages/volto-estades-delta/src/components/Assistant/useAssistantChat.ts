/**
 * useAssistantChat — Volto-native state for the assistant chat.
 *
 * The minimal replacement for the stellify InteluiContext: a single message
 * thread, send/cancel, and a sending flag. It drives the shared engine's
 * runConversationTurn with an ActionRegistry (empty for now → pure Q&A; when
 * the service emits tool calls and this host registers Volto content actions,
 * the same loop runs them without any change here).
 *
 * No react-router, no localStorage — just React state, SSR-safe.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActionRegistry,
  runConversationTurn,
  type ChatMessage,
} from '@stellifyit/assistant-ui-engine';
import { createAssistantClient } from './client';

const SEND_COOLDOWN_MS = 400;

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export interface UseAssistantChat {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  cancelSend: () => void;
}

export function useAssistantChat(sourceUid?: string): UseAssistantChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registry is cheap and pure. The client is created lazily on first send
  // (client-only) so we never touch `fetch` during SSR render. It's scoped to
  // the property in view via sourceUid.
  const registry = useMemo(() => new ActionRegistry(), []);
  const clientRef = useRef<ReturnType<typeof createAssistantClient> | null>(null);
  const getClient = useCallback(() => {
    if (!clientRef.current) clientRef.current = createAssistantClient(sourceUid);
    return clientRef.current;
  }, [sourceUid]);
  const abortRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<number>(0);

  const patchMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending) return;
      // Ignore Date.now-based cooldown on the server; this only runs client-side.
      const now = typeof performance !== 'undefined' ? performance.now() : 0;
      if (now - lastSendRef.current < SEND_COOLDOWN_MS) return;
      lastSendRef.current = now;

      setError(null);
      const nowIso = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: nextId('u'),
        role: 'user',
        text,
        createdAt: nowIso,
      };
      const pendingId = nextId('a');
      const pendingMsg: ChatMessage = {
        id: pendingId,
        role: 'assistant',
        text: '',
        createdAt: nowIso,
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, pendingMsg]);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      runConversationTurn({
        client: getClient(),
        registry,
        message: text,
        pageContext: {
          route:
            typeof window !== 'undefined' ? window.location.pathname : '/',
          snapshot: null,
        },
        signal: controller.signal,
      })
        .then((result) => {
          patchMessage(pendingId, {
            text: result.text || '…',
            pending: false,
            sources: result.sources,
          });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) {
            patchMessage(pendingId, { text: '⏹ Cancel·lat', pending: false });
          } else {
            const msg =
              err instanceof Error ? err.message : 'Error desconegut';
            patchMessage(pendingId, { text: `⚠️ ${msg}`, pending: false });
            setError(msg);
          }
        })
        .finally(() => {
          setSending(false);
          abortRef.current = null;
        });
    },
    [getClient, registry, sending, patchMessage],
  );

  const cancelSend = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, sending, error, sendMessage, cancelSend };
}
