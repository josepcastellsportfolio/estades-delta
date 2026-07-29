/**
 * FloatingPill — the fixed-corner icon button that opens/closes the assistant.
 *
 * Re-authored from the stellify InteluiPill into a corner FAB. Keeps the aria
 * contract (haspopup dialog + expanded state).
 */
import React from 'react';
import { useIntl } from 'react-intl';
import { assistantMessages as m } from '../../i18n/messages';

interface FloatingPillProps {
  open: boolean;
  onToggle: () => void;
}

const FloatingPill: React.FC<FloatingPillProps> = ({ open, onToggle }) => {
  const intl = useIntl();
  return (
    <button
      type="button"
      className={`ed-assistant-pill${open ? ' ed-assistant-pill--open' : ''}`}
      onClick={onToggle}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={intl.formatMessage(open ? m.close : m.openLabel)}
      title={intl.formatMessage(m.openLabel)}
    >
      {open ? (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5v-9Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
};

export default FloatingPill;
