/**
 * AssistantRoute — top-level route for /assistant.
 *
 * A single-surface route (the chat panel). Kept self-contained (no react-router
 * hooks) to match the Messaging pattern and stay portable across Volto majors.
 * SSR-safe: the panel's browser interactions all live in effects/handlers.
 */
import React from 'react';
import ChatPanel from './ChatPanel';

const AssistantRoute: React.FC = () => {
  return <ChatPanel />;
};

export default AssistantRoute;
