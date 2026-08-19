# ADR 024 — Canonical assistant API contract

**Status:** accepted
**Date:** 2026-07-07
**Related:** ADR 021 (shared service), ADR 022 (federated vectors), ADR 023 (tenancy)

## Context

There are two contracts in play today and **they do not match**:

- **The real service** (`recetia_assistant`, Django/DRF) exposes, under
  `/api/v1/assistant/`: `POST chat/` (`{query, session_id?}` → response),
  `GET/POST sessions/`, `GET sessions/<uuid>/history/`,
  `POST sessions/<uuid>/archive/`, `POST messages/feedback/`. All require
  `IsAuthenticated`, sessions are UUID-owned per user (404-not-403 on
  cross-user access), throttled by scope.
- **The intelUI frontend client** (`MicroserviceAssistantClient`) expects
  `POST /assistant/chat` with `{turn, history}` and
  `GET /assistant/conversations` — a stateless, history-in-body shape with no
  auth and no session UUIDs. It is currently dead code (the factory always
  returns the mock).

Neither is wired to the other. Federation (ADR 022) also adds a **second**
contract: the assistant → tenant search call, which doesn't exist yet.

## Decision

We adopt **the real service's contract as canonical** and adapt the frontend
to it. We define two contracts:

### A. Outward contract (frontend/consumer → assistant)

Keep the DRF surface as-is, session-based and authenticated:

- `POST /api/v1/assistant/chat/` — body `{query, session_id?}`; returns
  `{session_id, response, agent_type, structured_data, confidence,
  follow_up_suggestions, citations}`. **`citations` is added** to the response
  shape: a list of `{source_uid, url, title, score}` backing the answer.
- `GET /api/v1/assistant/sessions/`, `POST sessions/`,
  `GET sessions/<uuid>/history/`, `POST sessions/<uuid>/archive/`,
  `POST messages/feedback/` — unchanged.
- Auth: `IsAuthenticated` (end-user JWT) **plus** the per-tenant service token
  (ADR 023) that resolves to `tenant_id` server-side.

The intelUI `MicroserviceAssistantClient` is rewritten to this contract:
server-held history keyed by `session_id` (not `{turn, history}` in the body),
`conversations` → `sessions/`. The stateless client shape is dropped.

### B. Inward contract (assistant → tenant backend, for federated RAG)

A new, uniform `search` contract every tenant implements over its own store
(ADR 022):

- `POST <tenant-base>/@assistant-search` (Plone `plone.restapi` service for
  Estades Delta) — body `{query, k, min_score, language?}`; returns
  `{chunks: [{text, source_uid, url, title, score}]}`.
- The tenant **embeds the query itself** with the same model it indexed with,
  runs the KNN in its own vector store, and returns chunks with the source
  URL for citation. The assistant never sees the tenant's embeddings or model.
- Auth: the assistant presents its per-tenant service token (ADR 023); the
  tenant validates it.

### Retrieval / "no consta" policy (lives in the assistant)

- The assistant requests top-k with a `min_score` floor. If no chunk clears
  the floor, the LLM is instructed to answer **"no consta"** rather than
  invent — never an uncited answer. Concrete `k`, `min_score`, and chunking
  strategy are tuned during the Phase 3 pilot and recorded in that session
  log, not frozen here.

## Why the real service's contract wins

- **It is the hardened one.** Auth, per-user ownership with anti-enumeration
  404s, and scoped throttling already exist and are tested
  (`tests/test_api_security.py`). The frontend's stateless
  no-auth shape would throw all of that away.
- **Server-held history scales.** `{turn, history}` in the request body means
  the client resends the whole transcript every turn — quadratic payload
  growth and a place for clients to tamper with history. Session-UUID +
  server-side history is the correct shape.
- **Citations belong in the response, not reconstructed client-side.** Adding
  `citations` to the canonical response keeps the retrieval provenance
  authoritative and lets every consumer (Volto, others) render sources
  uniformly.

## Why a separate inward `search` contract

- Federation (ADR 022) means retrieval is a service call, not a local query.
  A single uniform `search` shape lets the assistant treat every tenant
  identically while each tenant keeps its own store, model, and engine behind
  it.
- Passing **query text** (not a vector) keeps the embedding model entirely
  inside the tenant, so tenants can differ (pgvector+Ollama here, Chroma
  elsewhere) with no coordination.

## Trade-offs we accepted

- **The dead frontend client is rewritten, not reused.** Its stateless shape
  was never wired; adapting it to session-based auth is real work but removes
  a contract fork.
- **Every tenant must implement `@assistant-search`.** Restated from ADR 022;
  the uniform shape is the price of federation.
- **Non-Vite frontends need env plumbing.** intelUI read its base URL from
  `VITE_ASSISTANT_SERVICE_URL`; Volto has no Vite. The base URL moves to
  Volto's runtime config (`RAZZLE_*` / `window.env`), decided in the frontend
  packaging work.

## Consequences

- Assistant: `api/views.py` chat response gains `citations`; tenant-token auth
  layer added (ADR 023); `RemoteSearchAdapter` calls contract B.
- Estades Delta: new `@assistant-search` `plone.restapi` endpoint over its
  revived pgvector store (ADR 022).
- Frontend: `MicroserviceAssistantClient` rewritten to contract A; base URL
  from runtime config.
- Pilot (Phase 3) tunes and records `k` / `min_score` / chunking.
