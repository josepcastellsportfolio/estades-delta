"""Embedding store adapters — pgvector-backed vector storage.

Two corpora, two tables, both in the `embeddings` schema (created by
devops/scripts/postgres-init.sql):

  - `message_embeddings` — guest-message bodies keyed by message UID, used by
    the M1 messaging IA to find similar past conversations. See EmbeddingStore.
  - `content_embeddings` — editorial content chunks (Property prose / KB),
    carrying citation metadata (source_uid, url, title, portal_type) so the
    federated assistant can answer with links. See ContentEmbeddingStore.

Keeping them physically separate is deliberate (ADR-022): the content corpus
is the tenant-owned RAG store the shared assistant queries via @assistant-search
(ADR-024); guest-message RAG is an unrelated collection.

Each store ships a real pgvector implementation + an in-memory Mock for tests.
Embeddings for content are computed with OllamaEmbedder (same Ollama host as
the chat model, ADR-022).
"""

from __future__ import annotations

import os

from dataclasses import dataclass
from dataclasses import field
from estades.delta import logger
from typing import ClassVar
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
        with self._connect() as conn, conn.cursor() as cur:
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


# ---------------------------------------------------------------------------
# Content corpus — the tenant-owned RAG store the federated assistant queries.
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class RetrievedChunk:
    """A content chunk returned by a similarity search, with citation data.

    `source_uid`/`url`/`title` let the assistant answer with a link back to the
    source page (ADR-024 contract B). `score` is cosine similarity in [0, 1]
    (1.0 = identical), derived as ``1 - cosine_distance``.
    """

    text: str
    source_uid: str
    url: str
    title: str
    portal_type: str
    chunk_index: int
    score: float


@runtime_checkable
class IContentEmbeddingStore(Protocol):

    def ensure_table(self) -> None:
        """Create the content_embeddings table if it doesn't exist."""
        ...

    def replace_document(self, source_uid: str, chunks: list[dict]) -> int:
        """Replace all chunks for a source object.

        `chunks` is a list of dicts, each:
            {text, embedding, url, title, portal_type, chunk_index}
        Deletes any existing rows for `source_uid` first so re-indexing an
        edited object never leaves stale chunks. Returns the number stored.
        """
        ...

    def delete_document(self, source_uid: str) -> int:
        """Remove all chunks for a source object (e.g. on unpublish/delete)."""
        ...

    def search(
        self,
        embedding: list[float],
        limit: int = 5,
        min_score: float = 0.0,
        source_uid: str | None = None,
    ) -> list[RetrievedChunk]:
        """Return the closest chunks with cosine similarity >= min_score.

        When `source_uid` is given, restrict the search to that source object.
        """
        ...


class PgvectorContentStore:
    """Real pgvector content store using psycopg2 directly."""

    # DSNs whose table has already been ensured this process, so the lazy
    # self-heal (see _ensure_once) is a no-op after the first call. Class-level
    # so all store instances in a process share it.
    _ensured_dsns: ClassVar[set[str]] = set()

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

    def _ensure_once(self) -> None:
        """Create the table on first read/write if the install step didn't.

        Decouples correctness from GenericSetup import-step ordering: retrieval
        and indexing self-heal a missing table instead of erroring. Runs the
        DDL at most once per (process, DSN).
        """
        if self._dsn in self._ensured_dsns:
            return
        self.ensure_table()
        self._ensured_dsns.add(self._dsn)

    def ensure_table(self) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS embeddings.content_embeddings (
                        id BIGSERIAL PRIMARY KEY,
                        source_uid TEXT NOT NULL,
                        chunk_index INT NOT NULL,
                        text TEXT NOT NULL,
                        url TEXT NOT NULL DEFAULT '',
                        title TEXT NOT NULL DEFAULT '',
                        portal_type TEXT NOT NULL DEFAULT '',
                        embedding vector({self._dim}) NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        UNIQUE (source_uid, chunk_index)
                    )
                """)
                # HNSW (not ivfflat): ivfflat is approximate and, with few rows
                # and the default probes=1, silently misses valid nearest
                # neighbours when the query lands in an empty list — fatal for a
                # store that starts tiny and must return *all* relevant chunks.
                # HNSW gives high recall with no lists/probes tuning and no
                # training step, at every dataset size.
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS ix_content_embeddings_vec
                    ON embeddings.content_embeddings
                    USING hnsw (embedding vector_cosine_ops)
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS ix_content_embeddings_source
                    ON embeddings.content_embeddings (source_uid)
                """)
            conn.commit()
        logger.info("ContentEmbeddingStore: table ensured (dim=%d)", self._dim)

    def replace_document(self, source_uid: str, chunks: list[dict]) -> int:
        self._ensure_once()
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM embeddings.content_embeddings WHERE source_uid = %s",
                    (source_uid,),
                )
                for c in chunks:
                    cur.execute(
                        """
                        INSERT INTO embeddings.content_embeddings
                            (source_uid, chunk_index, text, url, title,
                             portal_type, embedding)
                        VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                        """,
                        (
                            source_uid,
                            c["chunk_index"],
                            c["text"],
                            c.get("url", ""),
                            c.get("title", ""),
                            c.get("portal_type", ""),
                            str(c["embedding"]),
                        ),
                    )
            conn.commit()
        logger.info(
            "ContentEmbeddingStore: stored %d chunks for %s", len(chunks), source_uid
        )
        return len(chunks)

    def delete_document(self, source_uid: str) -> int:
        self._ensure_once()
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM embeddings.content_embeddings WHERE source_uid = %s",
                    (source_uid,),
                )
                deleted = cur.rowcount
            conn.commit()
        logger.info(
            "ContentEmbeddingStore: deleted %d chunks for %s", deleted, source_uid
        )
        return deleted

    def search(
        self,
        embedding: list[float],
        limit: int = 5,
        min_score: float = 0.0,
        source_uid: str | None = None,
    ) -> list[RetrievedChunk]:
        # cosine similarity = 1 - (embedding <=> query). pgvector's cosine
        # distance is in [0, 2], so similarity is in [-1, 1]. Only apply a
        # distance ceiling when a positive floor is requested; with min_score
        # <= 0 we return the nearest k regardless of how weak (true KNN), so
        # the caller's "no consta" decision is driven solely by min_score.
        # `source_uid` scopes the search to one content object (a property the
        # guest is viewing) when provided.
        self._ensure_once()
        # One %s for the SELECT distance; each optional clause adds its own
        # params; LIMIT is last. All conditions are fixed strings; every value
        # goes through psycopg2 parameters.
        params: list = [str(embedding)]
        clauses: list[str] = []
        if min_score > 0:
            clauses.append("embedding <=> %s::vector <= %s")
            params.extend([str(embedding), 1.0 - min_score])
        if source_uid:
            clauses.append("source_uid = %s")
            params.append(source_uid)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        params.append(limit)
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                    SELECT text, source_uid, url, title, portal_type, chunk_index,
                           embedding <=> %s::vector AS distance
                    FROM embeddings.content_embeddings
                    {where}
                    ORDER BY distance
                    LIMIT %s
                    """,  # noqa: S608 — clauses are trusted constants, values parametrized
                params,
            )
            return [
                RetrievedChunk(
                    text=row[0],
                    source_uid=row[1],
                    url=row[2],
                    title=row[3],
                    portal_type=row[4],
                    chunk_index=row[5],
                    score=1.0 - row[6],
                )
                for row in cur.fetchall()
            ]


@dataclass
class MockContentStore:
    """In-memory content store for tests."""

    _store: dict[str, list[dict]] = field(default_factory=dict)

    def ensure_table(self) -> None:
        pass

    def replace_document(self, source_uid: str, chunks: list[dict]) -> int:
        self._store[source_uid] = list(chunks)
        return len(chunks)

    def delete_document(self, source_uid: str) -> int:
        removed = self._store.pop(source_uid, [])
        return len(removed)

    def search(
        self,
        embedding: list[float],
        limit: int = 5,
        min_score: float = 0.0,
        source_uid: str | None = None,
    ) -> list[RetrievedChunk]:
        results: list[RetrievedChunk] = []
        for doc_uid, chunks in self._store.items():
            if source_uid and doc_uid != source_uid:
                continue
            for c in chunks:
                stored = c["embedding"]
                dot = sum(a * b for a, b in zip(embedding, stored, strict=False))
                norm_a = sum(a * a for a in embedding) ** 0.5
                norm_b = sum(b * b for b in stored) ** 0.5
                score = (dot / (norm_a * norm_b)) if norm_a and norm_b else 0.0
                # Mirror PgvectorContentStore: only gate on a positive floor;
                # min_score <= 0 returns the nearest chunks regardless of score.
                if min_score > 0 and score < min_score:
                    continue
                results.append(
                    RetrievedChunk(
                        text=c["text"],
                        source_uid=doc_uid,
                        url=c.get("url", ""),
                        title=c.get("title", ""),
                        portal_type=c.get("portal_type", ""),
                        chunk_index=c["chunk_index"],
                        score=score,
                    )
                )
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:limit]


def get_content_store() -> IContentEmbeddingStore:
    """Factory: returns PgvectorContentStore if DSN is set, else Mock."""
    dsn = os.environ.get("EMBEDDINGS_DB_DSN", "")
    if dsn:
        return PgvectorContentStore(dsn=dsn)
    logger.info("EMBEDDINGS_DB_DSN not set — using MockContentStore")
    return MockContentStore()


# ---------------------------------------------------------------------------
# Embedder — turns text into vectors via Ollama's /api/embeddings endpoint.
# ---------------------------------------------------------------------------


@runtime_checkable
class IEmbedder(Protocol):

    def embed(self, text: str) -> list[float]:
        """Return the embedding vector for a single text."""
        ...


class OllamaEmbedder:
    """Computes embeddings via Ollama, matching the LLM adapter's host.

    Uses the same Ollama server as the chat model (LLM_BASE_URL) but a
    dedicated embedding model (EMBEDDING_MODEL, default `nomic-embed-text`,
    which produces 768-dim vectors — matching EMBEDDING_DIM's default).
    """

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
    ):
        self._base_url = (
            base_url or os.environ.get("LLM_BASE_URL", "http://ollama:11434")
        ).rstrip("/")
        self._model = model or os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
        self._timeout = timeout or float(os.environ.get("LLM_TIMEOUT_SECONDS", "30"))

    def embed(self, text: str) -> list[float]:
        import httpx

        url = f"{self._base_url}/api/embeddings"
        payload = {"model": self._model, "prompt": text}
        resp = httpx.post(url, json=payload, timeout=self._timeout)
        resp.raise_for_status()
        return resp.json()["embedding"]


@dataclass
class MockEmbedder:
    """Deterministic embedder for tests — a tiny hashing bag-of-words vector.

    Not semantically meaningful, but stable and non-zero so cosine similarity
    behaves (identical text → identical vector → score 1.0).
    """

    dim: int = 16

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        for token in text.lower().split():
            vec[hash(token) % self.dim] += 1.0
        norm = sum(v * v for v in vec) ** 0.5
        return [v / norm for v in vec] if norm else vec


def get_embedder() -> IEmbedder:
    """Factory: returns OllamaEmbedder if LLM_BASE_URL is set, else Mock."""
    if os.environ.get("LLM_BASE_URL", ""):
        return OllamaEmbedder()
    logger.info("LLM_BASE_URL not set — using MockEmbedder")
    return MockEmbedder()
