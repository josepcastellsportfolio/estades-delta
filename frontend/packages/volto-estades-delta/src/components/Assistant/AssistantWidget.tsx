/**
 * AssistantWidget — floating guest-facing assistant on a property microsite.
 *
 * Mounted site-wide via config.settings.appExtras, but it only shows itself on
 * a Property page: it reads the current content from Redux (state.content.data)
 * and renders null unless that content is a published Property. From that
 * content it takes the UID, so the chat's RAG is scoped to the property the
 * visitor is actually viewing.
 *
 * Pattern mirrors the stellify intelUI FloatingBar/Pill: a fixed corner pill
 * (icon) toggles a panel that renders via createPortal(document.body) so it
 * escapes the property article's stacking/overflow. SSR-safe: the portal target
 * is resolved in an effect, and the panel returns null until it exists.
 */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import FloatingPill from './FloatingPill';
import FloatingPanel from './FloatingPanel';
import './AssistantWidget.scss';

interface ContentData {
  '@type'?: string;
  UID?: string;
  title?: string;
  palette?: { token?: string } | string;
  review_state?: string;
}

function paletteToken(palette: ContentData['palette']): string {
  if (!palette) return 'arrossar';
  if (typeof palette === 'string') return palette;
  return palette.token ?? 'arrossar';
}

const AssistantWidget: React.FC = () => {
  const content = useSelector(
    (state: { content?: { data?: ContentData } }) => state.content?.data,
  );
  const [open, setOpen] = useState(false);

  // Close on route change (content identity change).
  const uid = content?.UID;
  useEffect(() => {
    setOpen(false);
  }, [uid]);

  // Only on a Property page with a UID.
  if (!content || content['@type'] !== 'Property' || !uid) {
    return null;
  }

  return (
    <>
      <FloatingPill open={open} onToggle={() => setOpen((o) => !o)} />
      <FloatingPanel
        open={open}
        onClose={() => setOpen(false)}
        sourceUid={uid}
        contextTitle={content.title ?? ''}
        palette={paletteToken(content.palette)}
      />
    </>
  );
};

export default AssistantWidget;
