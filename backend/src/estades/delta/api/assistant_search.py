"""POST /++api++/@assistant-search — federated RAG retrieval endpoint.

ADR-024 contract B (the inward, assistant→tenant call). The shared assistant
sends a natural-language query; Plone embeds it with the same model it indexed
with, runs a KNN over its own content_embeddings store, and returns the top-k
chunks with citation metadata (source_uid, url, title). Plone owns the vector
(ADR-022) — the assistant never sees the embeddings or the model.

Body: {query: str, k?: int, min_score?: float, language?: str}
Reply: {chunks: [{text, source_uid, url, title, portal_type, chunk_index, score}]}

Auth: a shared service token (ASSISTANT_SERVICE_TOKEN) presented in the
X-Assistant-Token header. When the env var is unset (local dev), the check is
skipped. This is the Phase-1 stand-in for the per-tenant token layer described
in ADR-023; tighten to per-tenant tokens when the shared service lands.
"""

from __future__ import annotations

import hmac
import json
import os

from estades.delta import logger
from estades.delta.adapters.embedding_store import get_content_store
from estades.delta.adapters.embedding_store import get_embedder
from plone.restapi.services import Service


DEFAULT_K = 5
MAX_K = 20
DEFAULT_MIN_SCORE = 0.0


class AssistantSearchPost(Service):

    def reply(self):
        token = os.environ.get("ASSISTANT_SERVICE_TOKEN", "")
        if token:
            presented = self.request.getHeader("X-Assistant-Token") or ""
            if not hmac.compare_digest(presented, token):
                self.request.response.setStatus(403)
                return {"error": "Invalid service token"}

        raw_body = self.request.get("BODY")
        if isinstance(raw_body, bytes):
            try:
                data = json.loads(raw_body)
            except json.JSONDecodeError:
                self.request.response.setStatus(400)
                return {"error": "Invalid JSON"}
        else:
            data = raw_body
        if not isinstance(data, dict):
            self.request.response.setStatus(400)
            return {"error": "Expected JSON object"}

        query = (data.get("query") or "").strip()
        if not query:
            self.request.response.setStatus(400)
            return {"error": "Missing 'query' field"}

        k = min(int(data.get("k", DEFAULT_K)), MAX_K)
        min_score = float(data.get("min_score", DEFAULT_MIN_SCORE))

        embedder = get_embedder()
        store = get_content_store()

        query_embedding = embedder.embed(query)
        chunks = store.search(query_embedding, limit=k, min_score=min_score)

        logger.info(
            "assistant-search: query=%r k=%d min_score=%.2f -> %d chunks",
            query[:80], k, min_score, len(chunks),
        )

        return {
            "chunks": [
                {
                    "text": c.text,
                    "source_uid": c.source_uid,
                    "url": c.url,
                    "title": c.title,
                    "portal_type": c.portal_type,
                    "chunk_index": c.chunk_index,
                    "score": round(c.score, 4),
                }
                for c in chunks
            ]
        }
