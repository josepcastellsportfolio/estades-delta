"""GenericSetup step: ensure the pgvector embeddings tables exist.

Runs at profile install. The M1 message store and the content RAG store both
create their tables lazily via ensure_table(); calling them here means a fresh
site has both tables (and the pgvector extension + indexes) ready without a
first-request penalty. Both operations are idempotent (CREATE ... IF NOT
EXISTS), so re-running the profile is safe.

No-ops cleanly when EMBEDDINGS_DB_DSN is unset (the factories return in-memory
Mock stores whose ensure_table() does nothing) — e.g. in unit tests.
"""

from __future__ import annotations

from estades.delta import logger
from estades.delta.adapters.embedding_store import get_content_store
from estades.delta.adapters.embedding_store import get_embedding_store


def ensure_embeddings_tables(context) -> None:
    try:
        get_embedding_store().ensure_table()
        get_content_store().ensure_table()
    except Exception as exc:
        # A missing/unreachable embeddings DB shouldn't block site creation;
        # the tables get created lazily on first use anyway.
        logger.warning("Could not ensure embeddings tables at install: %s", exc)
