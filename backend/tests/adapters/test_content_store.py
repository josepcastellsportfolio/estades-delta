"""Tests for MockContentStore — in-memory content vector store (ADR-022)."""

from estades.delta.adapters.embedding_store import IContentEmbeddingStore
from estades.delta.adapters.embedding_store import MockContentStore
from estades.delta.adapters.embedding_store import RetrievedChunk


def _chunk(index, text, embedding, **meta):
    base = {
        "chunk_index": index,
        "text": text,
        "embedding": embedding,
        "url": meta.get("url", "http://x/prop"),
        "title": meta.get("title", "Casa Demo"),
        "portal_type": meta.get("portal_type", "Property"),
    }
    return base


def test_mock_implements_protocol():
    assert isinstance(MockContentStore(), IContentEmbeddingStore)


def test_replace_and_search_returns_citations():
    store = MockContentStore()
    store.ensure_table()
    store.replace_document(
        "prop-1",
        [
            _chunk(0, "the wifi password is delta1234", [1.0, 0.0, 0.0]),
            _chunk(1, "checkout is at 11am", [0.0, 1.0, 0.0]),
        ],
    )

    results = store.search([1.0, 0.0, 0.0], limit=1)
    assert len(results) == 1
    top = results[0]
    assert isinstance(top, RetrievedChunk)
    assert top.source_uid == "prop-1"
    assert top.url == "http://x/prop"
    assert top.title == "Casa Demo"
    assert top.portal_type == "Property"
    assert top.chunk_index == 0
    # cosine similarity of identical direction == 1.0
    assert top.score == 1.0


def test_replace_document_removes_stale_chunks():
    store = MockContentStore()
    store.replace_document("prop-1", [_chunk(0, "old text", [1.0, 0.0])])
    # Re-index with fewer/different chunks — old ones must not survive.
    store.replace_document("prop-1", [_chunk(0, "new text", [0.0, 1.0])])

    results = store.search([0.0, 1.0], limit=5)
    assert len(results) == 1
    assert results[0].text == "new text"


def test_delete_document():
    store = MockContentStore()
    store.replace_document("prop-1", [_chunk(0, "a", [1.0, 0.0])])
    store.replace_document("prop-2", [_chunk(0, "b", [0.0, 1.0])])

    deleted = store.delete_document("prop-1")
    assert deleted == 1
    remaining = store.search([1.0, 1.0], limit=5)
    assert {r.source_uid for r in remaining} == {"prop-2"}


def test_min_score_filters_weak_matches():
    store = MockContentStore()
    store.replace_document(
        "prop-1",
        [
            _chunk(0, "close", [1.0, 0.0]),
            _chunk(1, "orthogonal", [0.0, 1.0]),
        ],
    )
    # Query aligned with chunk 0; chunk 1 is orthogonal (similarity 0).
    results = store.search([1.0, 0.0], limit=5, min_score=0.5)
    assert [r.text for r in results] == ["close"]


def test_min_score_zero_returns_weak_and_negative_matches():
    # Regression: min_score <= 0 must behave as true KNN and return even
    # negatively-scored chunks (mirrors the pgvector store; the "no consta"
    # decision is driven solely by a positive floor). Previously an opposite
    # vector (similarity -1) was silently dropped at min_score=0.
    store = MockContentStore()
    store.replace_document(
        "prop-1",
        [
            _chunk(0, "aligned", [1.0, 0.0]),
            _chunk(1, "opposite", [-1.0, 0.0]),
        ],
    )
    results = store.search([1.0, 0.0], limit=5, min_score=0.0)
    assert {r.text for r in results} == {"aligned", "opposite"}
    # Ranked best-first: aligned (score 1.0) before opposite (score -1.0).
    assert results[0].text == "aligned"
    assert results[-1].score < 0


def test_positive_floor_gates_negative_matches():
    store = MockContentStore()
    store.replace_document(
        "prop-1",
        [
            _chunk(0, "aligned", [1.0, 0.0]),
            _chunk(1, "opposite", [-1.0, 0.0]),
        ],
    )
    results = store.search([1.0, 0.0], limit=5, min_score=0.1)
    assert [r.text for r in results] == ["aligned"]


def test_search_empty_store():
    assert MockContentStore().search([1.0, 0.0], limit=5) == []
