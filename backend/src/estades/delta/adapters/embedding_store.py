"""Embedding store adapter — pgvector-backed vector storage.

Stores message embeddings in the `embeddings` schema (created by
devops/scripts/postgres-init.sql). Keyed by message UID so we can
look up similar past conversations for RAG context.

Phase 1 ships EmbeddingStore (real pgvector) + MockEmbeddingStore (in-memory).
"""

from __future__ import annotations

import os

from dataclasses import dataclass
from dataclasses import field
from estades.delta import logger
from typing import Protocol
from typing import runtime_checkable


@dataclass(frozen=True)
class SimilarMessage:
    uid: str
    distance: float
    body: str


@runtime_checkable
class IEmbeddingStore(Protocol):

    def ensure_table(self) -> None:
        """Create the embeddings table if it doesn't exist."""
        ...

    def store(self, uid: str, body: str, embedding: list[float]) -> None:
        """Upsert an embedding for a message."""
        ...

    def search(self, embedding: list[float], limit: int = 5) -> list[SimilarMessage]:
        """Find the closest messages by cosine distance."""
        ...


class PgvectorEmbeddingStore:
    """Real pgvector store using psycopg2 directly."""

    def __init__(self, dsn: str | None = None, dim: int | None = None):
        self._dsn = dsn or os.environ.get(
            "EMBEDDINGS_DB_DSN", "postgresql://plone:plonedev@postgres:5432/plone"
        )
        self._dim = dim or int(os.environ.get("EMBEDDING_DIM", "768"))
        if not (64 <= self._dim <= 4096):
            raise ValueError(f"EMBEDDING_DIM must be 64..4096, got {self._dim}")

    def _connect(self):
        import psycopg2

        return psycopg2.connect(self._dsn)

    def ensure_table(self) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS embeddings.message_embeddings (
                        uid TEXT PRIMARY KEY,
                        body TEXT NOT NULL,
                        embedding vector({self._dim}) NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    )
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS ix_message_embeddings_vec
                    ON embeddings.message_embeddings
                    USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 10)
                """)
            conn.commit()
        logger.info("EmbeddingStore: table ensured (dim=%d)", self._dim)

    def store(self, uid: str, body: str, embedding: list[float]) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO embeddings.message_embeddings (uid, body, embedding)
                    VALUES (%s, %s, %s::vector)
                    ON CONFLICT (uid) DO UPDATE SET
                        body = EXCLUDED.body,
                        embedding = EXCLUDED.embedding
                    """,
                    (uid, body, str(embedding)),
                )
            conn.commit()

    def search(self, embedding: list[float], limit: int = 5) -> list[SimilarMessage]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT uid, body, embedding <=> %s::vector AS distance
                    FROM embeddings.message_embeddings
                    ORDER BY distance
                    LIMIT %s
                    """,
                    (str(embedding), limit),
                )
                return [
                    SimilarMessage(uid=row[0], distance=row[2], body=row[1])
                    for row in cur.fetchall()
                ]


@dataclass
class MockEmbeddingStore:
    """In-memory store for tests."""

    _store: dict[str, tuple[str, list[float]]] = field(default_factory=dict)

    def ensure_table(self) -> None:
        pass

    def store(self, uid: str, body: str, embedding: list[float]) -> None:
        self._store[uid] = (body, embedding)

    def search(self, embedding: list[float], limit: int = 5) -> list[SimilarMessage]:
        if not self._store:
            return []
        results = []
        for uid, (body, stored_emb) in self._store.items():
            dot = sum(a * b for a, b in zip(embedding, stored_emb))
            norm_a = sum(a * a for a in embedding) ** 0.5
            norm_b = sum(b * b for b in stored_emb) ** 0.5
            distance = 1.0 - (dot / (norm_a * norm_b)) if norm_a and norm_b else 1.0
            results.append(SimilarMessage(uid=uid, distance=distance, body=body))
        results.sort(key=lambda r: r.distance)
        return results[:limit]


def get_embedding_store() -> IEmbeddingStore:
    """Factory: returns PgvectorEmbeddingStore if DSN is set, else Mock."""
    dsn = os.environ.get("EMBEDDINGS_DB_DSN", "")
    if dsn:
        return PgvectorEmbeddingStore(dsn=dsn)
    logger.info("EMBEDDINGS_DB_DSN not set — using MockEmbeddingStore")
    return MockEmbeddingStore()
