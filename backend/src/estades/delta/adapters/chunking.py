"""Text chunking utilities for the content RAG indexer.

Pure functions, no Plone dependency, so they run in the Celery worker and are
trivially unit-testable. Content prose is RichText HTML (ADR-022 — the content
is NOT Volto blocks); we strip tags to plain text, then chunk on paragraph
boundaries with a soft size cap so each chunk is a coherent passage that fits
comfortably in the embedding model's context.
"""

from __future__ import annotations

import re

from html.parser import HTMLParser
from typing import ClassVar


class _TextExtractor(HTMLParser):
    """Collapses HTML to whitespace-separated text, dropping script/style."""

    _SKIP: ClassVar[set[str]] = {"script", "style"}
    # Tags that imply a paragraph/line break so words don't run together.
    _BREAK: ClassVar[set[str]] = {
        "p", "br", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr"
    }

    def __init__(self):
        super().__init__()
        self._parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self._SKIP:
            self._skip_depth += 1
        elif tag in self._BREAK:
            self._parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self._SKIP and self._skip_depth:
            self._skip_depth -= 1
        elif tag in self._BREAK:
            self._parts.append("\n")

    def handle_data(self, data):
        if not self._skip_depth:
            self._parts.append(data)

    def text(self) -> str:
        return "".join(self._parts)


def html_to_text(html: str) -> str:
    """Strip HTML tags, returning plain text with normalized whitespace."""
    if not html:
        return ""
    parser = _TextExtractor()
    parser.feed(html)
    raw = parser.text()
    # Collapse runs of spaces/tabs, keep paragraph breaks, trim.
    raw = re.sub(r"[ \t]+", " ", raw)
    raw = re.sub(r"\n[ \t]*", "\n", raw)
    raw = re.sub(r"\n{2,}", "\n\n", raw)
    return raw.strip()


def chunk_text(text: str, max_chars: int = 800, overlap_chars: int = 100) -> list[str]:
    """Split text into overlapping chunks on paragraph then sentence boundaries.

    Greedily packs whole paragraphs up to `max_chars`. A paragraph longer than
    the cap is split on sentence boundaries (then hard-split as a last resort).
    Consecutive chunks share `overlap_chars` of trailing context so a fact that
    straddles a boundary is still retrievable from at least one chunk.
    """
    text = text.strip()
    if not text:
        return []
    overlap_chars = max(0, min(overlap_chars, max_chars - 1))

    # No unit may exceed the cap on its own; a chunk's overlap prefix plus the
    # joining space then has to fit alongside it, so cap unit size at
    # (max_chars - overlap_chars - 1). Keep it >= 1.
    unit_cap = max(1, max_chars - overlap_chars - 1)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    units: list[str] = []
    for para in paragraphs:
        if len(para) <= unit_cap:
            units.append(para)
        else:
            units.extend(_split_long(para, unit_cap))

    chunks: list[str] = []
    current = ""
    for unit in units:
        if current and len(current) + len(unit) + 1 > max_chars:
            chunks.append(current)
            tail = current[-overlap_chars:] if overlap_chars else ""
            current = f"{tail} {unit}".strip() if tail else unit
        else:
            current = f"{current} {unit}".strip() if current else unit
    if current:
        chunks.append(current)
    return chunks


def _split_long(para: str, cap: int) -> list[str]:
    """Split an over-long paragraph into pieces no larger than `cap`.

    Splits on sentence boundaries first; a single sentence longer than `cap`
    is hard-split. Every returned piece satisfies ``len(piece) <= cap``.
    """
    sentences = re.split(r"(?<=[.!?])\s+", para)
    out: list[str] = []
    current = ""
    for sent in sentences:
        while len(sent) > cap:
            # A single sentence longer than the cap: hard-split.
            if current:
                out.append(current)
                current = ""
            out.append(sent[:cap])
            sent = sent[cap:]
        if not sent:
            continue
        if current and len(current) + len(sent) + 1 > cap:
            out.append(current)
            current = sent
        else:
            current = f"{current} {sent}".strip() if current else sent
    if current:
        out.append(current)
    return out
