"""Tests for the embedder factory + MockEmbedder."""

import pytest

from estades.delta.adapters.embedding_store import IEmbedder
from estades.delta.adapters.embedding_store import MockEmbedder
from estades.delta.adapters.embedding_store import OllamaEmbedder
from estades.delta.adapters.embedding_store import get_embedder


@pytest.fixture(autouse=True)
def _clear_llm_env(monkeypatch):
    monkeypatch.delenv("LLM_BASE_URL", raising=False)


def test_mock_implements_protocol():
    assert isinstance(MockEmbedder(), IEmbedder)


def test_factory_returns_mock_without_base_url():
    assert isinstance(get_embedder(), MockEmbedder)


def test_factory_returns_ollama_with_base_url(monkeypatch):
    monkeypatch.setenv("LLM_BASE_URL", "http://ollama:11434")
    assert isinstance(get_embedder(), OllamaEmbedder)


def test_mock_embed_is_stable_and_normalized():
    embedder = MockEmbedder(dim=16)
    a = embedder.embed("the wifi password")
    b = embedder.embed("the wifi password")
    assert a == b  # deterministic within a process
    assert len(a) == 16
    norm = sum(x * x for x in a) ** 0.5
    assert abs(norm - 1.0) < 1e-9  # unit vector


def test_mock_embed_empty_text():
    # No tokens -> zero vector, no division-by-zero.
    assert MockEmbedder(dim=8).embed("") == [0.0] * 8
