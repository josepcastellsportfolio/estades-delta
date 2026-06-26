/**
 * ConversationDetail — message thread + approval UI for one GuestConversation.
 *
 * Receives the conversation path from the URL (everything after /messaging/).
 * Renders the message thread chronologically; for inbound messages with an
 * IA-suggested response, shows an editable textarea + Approve/Send button
 * that calls @approve-response.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { messagingMessages as m } from '../../i18n/messages';
import {
  approveResponse,
  fetchConversation,
  type ConversationDetail as ConversationDetailData,
  type GuestMessage,
} from './api';
import './Messaging.scss';

function formatTimestamp(value: string | undefined, locale: string): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

interface ConversationDetailProps {
  conversationPath: string;
  onBack?: () => void;
}

interface PendingApproval {
  messageUid: string;
  text: string;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationPath,
  onBack,
}) => {
  const intl = useIntl();

  const [data, setData] = useState<ConversationDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const detail = await fetchConversation(conversationPath, controller.signal);
      setData(detail);
      const initialDrafts: Record<string, string> = {};
      for (const msg of detail.items ?? []) {
        if (msg.ia_suggested_response) {
          initialDrafts[msg.UID] = msg.ia_suggested_response;
        }
      }
      setDrafts(initialDrafts);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(intl.formatMessage(m.loadError));
      setData(null);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [conversationPath, intl]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const handleApprove = useCallback(
    async (pending: PendingApproval) => {
      setApproving(pending.messageUid);
      try {
        await approveResponse({
          message_uid: pending.messageUid,
          approved_text: pending.text,
        });
        if (mountedRef.current) {
          await load();
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            `${intl.formatMessage(m.approveError)}: ${(err as Error).message}`,
          );
        }
      } finally {
        if (mountedRef.current) {
          setApproving(null);
        }
      }
    },
    [intl, load],
  );

  const locale = intl.locale || 'ca-ES';

  const messages = useMemo<GuestMessage[]>(() => {
    if (!data?.items) return [];
    return [...data.items].sort((a, b) => a.created.localeCompare(b.created));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="ed-messaging">
        <div className="ed-messaging__status" role="status">
          <FormattedMessage {...m.loading} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="ed-messaging">
        <div className="ed-messaging__status ed-messaging__status--error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="ed-messaging">
      {onBack ? (
        <button type="button" className="ed-messaging__back" onClick={onBack}>
          ← <FormattedMessage {...m.backToList} />
        </button>
      ) : null}

      <header>
        <h1 className="ed-messaging__heading">{data.title}</h1>
        <p className="ed-messaging__subheading">
          <FormattedMessage
            {...m.detailSubtitle}
            values={{
              channel: data.channel || '—',
              mode: data.mode || 'assisted',
              state: data.review_state,
            }}
          />
        </p>
      </header>

      {error ? (
        <div className="ed-messaging__status ed-messaging__status--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="ed-messaging__thread">
        {messages.map((msg) => {
          const isInbound = msg.direction === 'inbound';
          const hasSuggestion =
            isInbound && !!msg.ia_suggested_response && !msg.ia_sent;
          const draft = drafts[msg.UID] ?? msg.ia_suggested_response ?? '';

          return (
            <div
              key={msg.UID}
              className={`ed-messaging__message ed-messaging__message--${msg.direction}`}
            >
              <div className="ed-messaging__message-meta">
                {msg.direction} · {formatTimestamp(msg.created, locale)}
                {msg.classification ? ` · ${msg.classification}` : ''}
                {msg.classification_confidence != null
                  ? ` (${(msg.classification_confidence * 100).toFixed(0)}%)`
                  : ''}
                {msg.ia_sent ? ' · IA' : ''}
                {msg.human_approved_by ? ` · ✓ ${msg.human_approved_by}` : ''}
              </div>
              <div className="ed-messaging__message-body">{msg.body}</div>

              {hasSuggestion ? (
                <div className="ed-messaging__message-suggestion">
                  <label htmlFor={`draft-${msg.UID}`}>
                    <FormattedMessage {...m.suggestedResponse} />
                  </label>
                  <textarea
                    id={`draft-${msg.UID}`}
                    value={draft}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [msg.UID]: e.target.value }))
                    }
                    disabled={approving === msg.UID}
                  />
                  <div className="ed-messaging__actions">
                    <button
                      type="button"
                      onClick={() =>
                        handleApprove({ messageUid: msg.UID, text: draft })
                      }
                      disabled={approving === msg.UID || !draft.trim()}
                    >
                      {approving === msg.UID ? (
                        <FormattedMessage {...m.approving} />
                      ) : (
                        <FormattedMessage {...m.approveSend} />
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {messages.length === 0 ? (
          <div className="ed-messaging__status">
            <FormattedMessage {...m.noMessages} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConversationDetail;
