"""Tests for the content indexer tasks (index_content / deindex_content).

Call the task functions directly (no Celery broker). Env vars are unset so the
mock embedder/store are used. The mock store's factory returns a fresh instance
per call, so these tests assert on each task's return contract rather than
round-tripping through a shared store (that path is covered by the content-store
and endpoint tests).
"""

import pytest


@pytest.fixture(autouse=True)
def _mock_env(monkeypatch):
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.delenv("EMBEDDINGS_DB_DSN", raising=False)


def _make_document(**overrides):
    base = {
        "source_uid": "prop-1",
        "url": "http://casa-demo.estadesdelta.local/properties/casa-demo",
        "title": "Casa Demo",
        "portal_type": "Property",
        "fields": {
            "long_description": "<p>A lovely house by the Ebro Delta.</p>",
            "house_rules_kb": "<p>No smoking indoors. Quiet after 22h.</p>",
        },
    }
    base.update(overrides)
    return base


def test_index_content_chunks_all_fields():
    from estades.delta.tasks.embeddings import index_content

    result = index_content(_make_document())
    assert result["source_uid"] == "prop-1"
    # Two short prose fields -> at least two chunks.
    assert result["chunks"] >= 2


def test_index_content_empty_fields_stores_nothing():
    from estades.delta.tasks.embeddings import index_content

    result = index_content(_make_document(fields={}))
    assert result["chunks"] == 0


def test_index_content_ignores_blank_html():
    from estades.delta.tasks.embeddings import index_content

    doc = _make_document(fields={"long_description": "<p></p>", "house_rules_kb": ""})
    result = index_content(doc)
    assert result["chunks"] == 0


def test_deindex_content_returns_source_uid():
    from estades.delta.tasks.embeddings import deindex_content

    result = deindex_content("prop-1")
    assert result["source_uid"] == "prop-1"
    assert "deleted" in result
