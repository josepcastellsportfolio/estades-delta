"""Embedding-related async tasks.

Two flavours, both running on the Ollama embedding model:

  - store_message_embedding — guest-message embeddings (M1 messaging IA).
  - index_content / deindex_content — the content RAG indexer (ADR-022). The
    Plone side extracts a plain document dict (prose fields + citation metadata)
    and enqueues index_content; the worker chunks, embeds, and upserts into the
    content_embeddings store the federated assistant queries via
    @assistant-search (ADR-024).

The worker has no ZODB/Plone context, so these tasks receive already-extracted
plain data — never content objects.
"""

from __future__ import annotations

from estades.delta import logger
from estades.delta.adapters.chunking import chunk_text
from estades.delta.adapters.chunking import html_to_text
from estades.delta.adapters.embedding_store import get_content_store
from estades.delta.adapters.embedding_store import get_embedder
from estades.delta.adapters.embedding_store import get_embedding_store
from estades.delta.celery_app import app


@app.task(name="estades.delta.tasks.embeddings.store_message_embedding")
def store_message_embedding(message_uid: str, body: str, embedding: list[float]) -> dict:
    """Store a pre-computed embedding for a guest message."""
    store = get_embedding_store()
    store.store(uid=message_uid, body=body, embedding=embedding)
    logger.info("Stored embedding for message %s", message_uid)
    return {"uid": message_uid, "stored": True}


@app.task(name="estades.delta.tasks.embeddings.index_content", queue="embeddings")
def index_content(document: dict) -> dict:
    """Chunk, embed and upsert one content object's prose for RAG.

    `document` is a plain dict extracted Plone-side (see content_indexing.py):
        {
            "source_uid": str,
            "url": str,
            "title": str,
            "portal_type": str,
            "fields": {field_name: html_or_text, ...},  # RichText raw / plain
        }

    Each field's prose is stripped of HTML and chunked; every chunk is embedded
    and stored with citation metadata. Re-indexing replaces all prior chunks for
    the source_uid so edits never leave stale text behind.
    """
    source_uid = document["source_uid"]
    embedder = get_embedder()
    store = get_content_store()

    chunks: list[dict] = []
    for field_name, value in (document.get("fields") or {}).items():
        text = html_to_text(value or "")
        for passage in chunk_text(text):
            chunks.append(
                {
                    "chunk_index": len(chunks),
                    "text": passage,
                    "embedding": embedder.embed(passage),
                    "url": document.get("url", ""),
                    "title": document.get("title", ""),
                    "portal_type": document.get("portal_type", ""),
                    "field": field_name,
                }
            )

    stored = store.replace_document(source_uid, chunks)
    logger.info("Indexed %d content chunks for %s", stored, source_uid)
    return {"source_uid": source_uid, "chunks": stored}


@app.task(name="estades.delta.tasks.embeddings.deindex_content", queue="embeddings")
def deindex_content(source_uid: str) -> dict:
    """Remove all indexed chunks for a content object (unpublish/delete)."""
    store = get_content_store()
    deleted = store.delete_document(source_uid)
    logger.info("De-indexed content %s (%d chunks)", source_uid, deleted)
    return {"source_uid": source_uid, "deleted": deleted}
