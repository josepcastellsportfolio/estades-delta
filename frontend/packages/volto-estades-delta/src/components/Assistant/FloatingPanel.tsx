/**
 * FloatingPanel — the floating chat overlay, portaled to document.body.
 *
 * Re-authored from the stellify InteluiFloatingBar into Volto SCSS/BEM. Renders
 * via createPortal so it escapes the property article's stacking/overflow;
 * SSR-safe (portalTarget resolved in an effect; returns null until it exists
 * and the panel is open). Reuses useAssistantChat, scoped to the property UID,
 * and PaletteScope so the panel inherits the property's colour.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import type { ChatMessage } from '@stellifyit/assistant-ui-engine';
import PaletteScope from '../PaletteScope/PaletteScope';
import { assistantMessages as m } from '../../i18n/messages';
import { useAssistantChat } from './useAssistantChat';

interface FloatingPanelProps {
  open: boolean;
  onClose: () => void;
  sourceUid: string;
  contextTitle: string;
  palette: string;
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const intl = useIntl();
  if (message.role === 'user') {
    return (
      <li className="ed-assistant__msg ed-assistant__msg--user">
        <div className="ed-assistant__bubble">{message.text}</div>
      </li>
    );
  }
  if (message.pending) {
    return (
      <li className="ed-assistant__msg ed-assistant__msg--assistant">
        <span className="ed-assistant__thinking">
          {intl.formatMessage(m.thinking)}
        </span>
      </li>
    );
  }
  return (
    <li className="ed-assistant__msg ed-assistant__msg--assistant">
      <div className="ed-assistant__bubble">{message.text}</div>
      {message.sources && message.sources.length > 0 && (
        <ul className="ed-assistant__sources">
          {message.sources.map((s) => (
            <li key={s.url} className="ed-assistant__source">
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title || s.url}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const FloatingPanel: React.FC<FloatingPanelProps> = ({
  open,
  onClose,
  sourceUid,
  contextTitle,
  palette,
}) => {
  const intl = useIntl();
  const { messages, sending, sendMessage, cancelSend } =
    useAssistantChat(sourceUid);
  const [value, setValue] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const logRef = useRef<HTMLUListElement>(null);

  // Resolve the portal target client-side only (SSR safety).
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Auto-scroll to newest message.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!portalTarget || !open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || sending) return;
    sendMessage(value);
    setValue('');
  };

  return createPortal(
    <PaletteScope
      palette={palette}
      as="div"
      className="ed-assistant-panel"
      role="dialog"
      aria-label={intl.formatMessage(m.heading)}
    >
      <header className="ed-assistant-panel__header">
        <div>
          <p className="ed-assistant-panel__title">
            {intl.formatMessage(m.heading)}
          </p>
          {contextTitle && (
            <p className="ed-assistant-panel__context">{contextTitle}</p>
          )}
        </div>
        <button
          type="button"
          className="ed-assistant-panel__close"
          onClick={onClose}
          aria-label={intl.formatMessage(m.close)}
        >
          ✕
        </button>
      </header>

      <ul
        ref={logRef}
        className="ed-assistant__log"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <li className="ed-assistant__empty">
            {intl.formatMessage(m.emptyHint)}
          </li>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </ul>

      <form className="ed-assistant__inputbar" onSubmit={submit}>
        <input
          className="ed-assistant__input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={intl.formatMessage(m.inputPlaceholder)}
          aria-label={intl.formatMessage(m.inputLabel)}
          disabled={sending}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        {sending ? (
          <button
            type="button"
            className="ed-assistant__btn ed-assistant__btn--stop"
            onClick={cancelSend}
          >
            {intl.formatMessage(m.stop)}
          </button>
        ) : (
          <button
            type="submit"
            className="ed-assistant__btn ed-assistant__btn--send"
            disabled={!value.trim()}
          >
            {intl.formatMessage(m.send)}
          </button>
        )}
      </form>
    </PaletteScope>,
    portalTarget,
  );
};

export default FloatingPanel;
