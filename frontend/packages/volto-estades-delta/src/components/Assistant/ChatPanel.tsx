/**
 * ChatPanel — the assistant chat surface (view).
 *
 * Re-authored from the stellify intelUI chat panel into Volto conventions:
 * SCSS/BEM (ed-assistant__*) with --ed-* palette tokens instead of Tailwind.
 * Renders the transcript (user/assistant bubbles, "thinking" placeholder while
 * pending), a citation slot under assistant answers, and the input bar with a
 * send/stop toggle. Accessibility mirrors the original (role="log" +
 * aria-live). Engine-agnostic: it takes the hook's state + callbacks.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import type { ChatMessage } from '@stellifyit/assistant-ui-engine';
import { assistantMessages as m } from '../../i18n/messages';
import { useAssistantChat } from './useAssistantChat';
import './Assistant.scss';

const AssistantMessageBubble: React.FC<{ message: ChatMessage }> = ({
  message,
}) => {
  const intl = useIntl();
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

const ChatPanel: React.FC = () => {
  const intl = useIntl();
  const { messages, sending, sendMessage, cancelSend } = useAssistantChat();
  const [value, setValue] = useState('');
  const logRef = useRef<HTMLUListElement>(null);

  // Auto-scroll to the newest message (client-only; useEffect never runs on SSR).
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || sending) return;
    sendMessage(value);
    setValue('');
  };

  return (
    <div className="ed-assistant">
      <header className="ed-assistant__header">
        <h1 className="ed-assistant__heading">
          {intl.formatMessage(m.heading)}
        </h1>
        <p className="ed-assistant__subheading">
          {intl.formatMessage(m.subheading)}
        </p>
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
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <li
              key={msg.id}
              className="ed-assistant__msg ed-assistant__msg--user"
            >
              <div className="ed-assistant__bubble">{msg.text}</div>
            </li>
          ) : (
            <AssistantMessageBubble key={msg.id} message={msg} />
          ),
        )}
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
    </div>
  );
};

export default ChatPanel;
