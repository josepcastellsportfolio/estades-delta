"""Tests for MockEmbeddingStore — in-memory vector store."""

from estades.delta.adapters.embedding_store import IEmbeddingStore
from estades.delta.adapters.embedding_store import MockEmbeddingStore
from estades.delta.adapters.embedding_store import SimilarMessage


def test_mock_implements_protocol():
    assert isinstance(MockEmbeddingStore(), IEmbeddingStore)


def test_store_and_search():
    store = MockEmbeddingStore()
    store.ensure_table()
    store.store("msg-1", "wifi password please", [1.0, 0.0, 0.0])
    store.store("msg-2", "checkout time?", [0.0, 1.0, 0.0])
    store.store("msg-3", "what is the wifi?", [0.9, 0.1, 0.0])

    results = store.search([1.0, 0.0, 0.0], limit=2)
    assert len(results) == 2
    assert all(isinstance(r, SimilarMessage) for r in results)
    assert results[0].uid == "msg-1"
    assert results[0].distance < results[1].distance


def test_search_empty_store():
    store = MockEmbeddingStore()
    assert store.search([1.0, 0.0], limit=5) == []


def test_upsert_overwrites():
    store = MockEmbeddingStore()
    store.store("msg-1", "original", [1.0, 0.0])
    store.store("msg-1", "updated", [0.0, 1.0])
    results = store.search([0.0, 1.0], limit=1)
    assert results[0].body == "updated"
