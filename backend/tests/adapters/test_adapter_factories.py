"""Tests for adapter factory functions — env-based adapter selection."""

import os


def test_llm_factory_returns_mock_when_no_url(monkeypatch):
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    from estades.delta.adapters.llm import MockLLMAdapter
    from estades.delta.adapters.llm import get_llm_adapter

    adapter = get_llm_adapter()
    assert isinstance(adapter, MockLLMAdapter)


def test_llm_factory_returns_ollama_when_url_set(monkeypatch):
    monkeypatch.setenv("LLM_BASE_URL", "http://localhost:11434")
    from estades.delta.adapters.llm import OllamaAdapter
    from estades.delta.adapters.llm import get_llm_adapter

    adapter = get_llm_adapter()
    assert isinstance(adapter, OllamaAdapter)


def test_embedding_factory_returns_mock_when_no_dsn(monkeypatch):
    monkeypatch.delenv("EMBEDDINGS_DB_DSN", raising=False)
    from estades.delta.adapters.embedding_store import MockEmbeddingStore
    from estades.delta.adapters.embedding_store import get_embedding_store

    adapter = get_embedding_store()
    assert isinstance(adapter, MockEmbeddingStore)


def test_embedding_factory_returns_pgvector_when_dsn_set(monkeypatch):
    monkeypatch.setenv("EMBEDDINGS_DB_DSN", "postgresql://user:pass@host/db")
    from estades.delta.adapters.embedding_store import PgvectorEmbeddingStore
    from estades.delta.adapters.embedding_store import get_embedding_store

    adapter = get_embedding_store()
    assert isinstance(adapter, PgvectorEmbeddingStore)


def test_messaging_factory_returns_stub(monkeypatch):
    monkeypatch.setenv("MESSAGING_ADAPTER", "stub")
    from estades.delta.adapters.messaging import StubMessagingAdapter
    from estades.delta.adapters.messaging import get_messaging_adapter

    adapter = get_messaging_adapter()
    assert isinstance(adapter, StubMessagingAdapter)


def test_messaging_factory_falls_back_to_stub_for_unknown(monkeypatch):
    monkeypatch.setenv("MESSAGING_ADAPTER", "nonexistent")
    from estades.delta.adapters.messaging import StubMessagingAdapter
    from estades.delta.adapters.messaging import get_messaging_adapter

    adapter = get_messaging_adapter()
    assert isinstance(adapter, StubMessagingAdapter)
