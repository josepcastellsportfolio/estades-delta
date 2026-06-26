/**
 * ConversationList — lists guest conversations visible to the current user.
 *
 * Mounted at /messaging via addonRoutes. Managers see all conversations;
 * non-managers see only those they created (backend filter). Clicking a
 * row navigates to /messaging/<conversation-path>.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { messagingMessages as m } from '../../i18n/messages';
import {
  type ConversationSummary,
  listConversations,
} from './api';
import { navigateMessaging } from './MessagingRoute';
import './Messaging.scss';

const PAGE_SIZE = 25;

function formatDate(value: string | null, locale: string): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

interface ConversationListProps {
  onSelect?: (item: ConversationSummary) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelect }) => {
  const intl = useIntl();

  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (nextPage: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await listConversations({
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
        signal: controller.signal,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(intl.formatMessage(m.loadError));
      setItems([]);
      setTotal(0);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    load(0);
    return () => abortRef.current?.abort();
  }, [load]);

  const handleSelect = useCallback(
    (item: ConversationSummary) => {
      if (onSelect) {
        onSelect(item);
        return;
      }
      const path = item.url.replace(/^https?:\/\/[^/]+/, '');
      navigateMessaging(path);
    },
    [onSelect],
  );

  const handlePrev = useCallback(() => {
    if (page === 0) return;
    const next = page - 1;
    setPage(next);
    load(next);
  }, [page, load]);

  const handleNext = useCallback(() => {
    const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
    if (page >= maxPage) return;
    const next = page + 1;
    setPage(next);
    load(next);
  }, [page, total, load]);

  const locale = intl.locale || 'ca-ES';
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="ed-messaging">
      <header>
        <h1 className="ed-messaging__heading">
          <FormattedMessage {...m.listTitle} />
        </h1>
        <p className="ed-messaging__subheading">
          <FormattedMessage {...m.listSubtitle} values={{ count: total }} />
        </p>
      </header>

      {loading ? (
        <div className="ed-messaging__status" role="status">
          <FormattedMessage {...m.loading} />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="ed-messaging__status ed-messaging__status--error" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="ed-messaging__status">
          <FormattedMessage {...m.empty} />
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <table className="ed-messaging__table">
            <thead>
              <tr>
                <th><FormattedMessage {...m.colTitle} /></th>
                <th><FormattedMessage {...m.colChannel} /></th>
                <th><FormattedMessage {...m.colState} /></th>
                <th><FormattedMessage {...m.colModified} /></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.uid}
                  onClick={() => handleSelect(item)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(item);
                    }
                  }}
                >
                  <td>{item.title}</td>
                  <td>{item.channel || '—'}</td>
                  <td>
                    <span
                      className={`ed-messaging__pill ed-messaging__pill--${(item.review_state || '').replace(/\W/g, '_')}`}
                    >
                      {item.review_state}
                    </span>
                  </td>
                  <td>{formatDate(item.modified, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > PAGE_SIZE ? (
            <div className="ed-messaging__actions">
              <button type="button" onClick={handlePrev} disabled={page === 0}>
                <FormattedMessage {...m.prev} />
              </button>
              <span>
                <FormattedMessage
                  {...m.page}
                  values={{ current: page + 1, total: maxPage + 1 }}
                />
              </span>
              <button type="button" onClick={handleNext} disabled={page >= maxPage}>
                <FormattedMessage {...m.next} />
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default ConversationList;
