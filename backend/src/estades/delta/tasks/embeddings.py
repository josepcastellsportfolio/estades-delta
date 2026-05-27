"""Embedding-related async tasks.

Embeddings are generated after a message is classified and stored in
pgvector for future RAG retrieval. The embedding model runs on Ollama
alongside the chat model.
"""

from __future__ import annotations

from estades.delta import logger
from estades.delta.adapters.embedding_store import get_embedding_store
from estades.delta.celery_app import app


@app.task(name="estades.delta.tasks.embeddings.store_message_embedding")
def store_message_embedding(message_uid: str, body: str, embedding: list[float]) -> dict:
    """Store a pre-computed embedding for a guest message."""
    store = get_embedding_store()
    store.store(uid=message_uid, body=body, embedding=embedding)
    logger.info("Stored embedding for message %s", message_uid)
    return {"uid": message_uid, "stored": True}
