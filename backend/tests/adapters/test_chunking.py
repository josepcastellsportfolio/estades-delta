"""Tests for the chunking / HTML-stripping utilities."""

from estades.delta.adapters.chunking import chunk_text
from estades.delta.adapters.chunking import html_to_text


def test_html_to_text_strips_tags():
    html = "<p>Hello <strong>world</strong></p><p>Second para</p>"
    text = html_to_text(html)
    assert "Hello world" in text
    assert "Second para" in text
    assert "<" not in text


def test_html_to_text_drops_script_and_style():
    html = "<style>.x{color:red}</style><p>Visible</p><script>alert(1)</script>"
    text = html_to_text(html)
    assert "Visible" in text
    assert "color" not in text
    assert "alert" not in text


def test_html_to_text_empty():
    assert html_to_text("") == ""
    assert html_to_text(None) == ""


def test_chunk_text_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_text_short_stays_single():
    chunks = chunk_text("A short paragraph.", max_chars=800)
    assert chunks == ["A short paragraph."]


def test_chunk_text_splits_on_paragraphs():
    para = "word " * 100  # ~500 chars
    text = f"{para.strip()}\n\n{para.strip()}\n\n{para.strip()}"
    chunks = chunk_text(text, max_chars=600, overlap_chars=0)
    assert len(chunks) >= 2
    assert all(len(c) <= 700 for c in chunks)  # cap + one unit tolerance


def test_chunk_text_overlap_carries_context():
    text = "AAAA.\n\n" + ("B" * 700) + "\n\n" + ("C" * 700)
    chunks = chunk_text(text, max_chars=750, overlap_chars=50)
    assert len(chunks) >= 2
    # Consecutive chunks share trailing context.
    assert chunks[1].startswith(chunks[0][-50:][:10])


def test_chunk_text_hard_splits_oversized_sentence():
    giant = "X" * 2000  # no sentence boundaries, no spaces
    chunks = chunk_text(giant, max_chars=500)
    assert len(chunks) >= 4
    assert all(len(c) <= 500 for c in chunks)
