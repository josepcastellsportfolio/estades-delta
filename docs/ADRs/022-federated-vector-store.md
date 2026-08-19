# ADR 022 — Federated vector store: each project owns its own vectors

**Status:** accepted
**Date:** 2026-07-07
**Refines:** ADR 007 (pgvector over Chroma) — keeps pgvector, changes *who* owns it
**Related:** ADR 021 (shared assistant service), ADR 024 (API contract)

## Context

ADR 021 makes the assistant a single shared service across projects. That
raises the question: **where do the content embeddings live?**

Two shapes were on the table:

1. **Central** — the shared assistant owns one vector store; every project
   pushes its content to the assistant, which embeds and stores it, namespaced
   by tenant.
2. **Federated** — each project owns its own vector store; the assistant holds
   *no* embeddings and asks each project's backend to search its own store at
   query time.

Estades Delta already shipped, in M1, a real (but currently inert) pgvector
adapter inside Plone: `backend/src/estades/delta/adapters/embedding_store.py`,
targeting the Postgres `embeddings` schema with `EMBEDDING_DIM=768`. The M1
`ChannelManager`-adjacent plumbing (Celery `embeddings` queue, `pgvector`
dependency, the empty `embeddings` schema in `postgres-init.sql`) is all
already in place — it just has no caller and points at guest messages rather
than content.

## Decision

**Vectors are federated. Each project owns and operates its own vector store.
The shared assistant stores no embeddings.**

- The assistant is a **thin RAG orchestrator**. At query time it calls the
  originating tenant's backend with "give me the top-k relevant chunks for
  this query," gets back chunks with `source_uid` + source URL, and the LLM
  answers anchored to those chunks (with citations; "no consta" below a
  retrieval threshold).
- This is implemented as a `RemoteSearchAdapter` behind the package's existing
  `VectorStorePort.search()` — an HTTP call to the tenant, not a local
  pgvector. `VectorStorePort.add_documents()` is **not used by the assistant**;
  ingestion is each project's own concern in its own store.
- **Estades Delta owns its vector in Plone.** The inert M1 `embedding_store.py`
  is revived: `ensure_table()` runs at bootstrap, an indexer embeds the
  content prose fields (`long_description`, `house_rules`, and the
  `IKnowledgeBase` RichText fields) on publish/edit, embeddings are computed
  via Ollama (`nomic-embed-text`, 768-dim), and a `@assistant-search`
  `plone.restapi` endpoint serves retrieval. Note: this store is
  re-pointed from *guest messages* to *content* — guest-message RAG, if ever
  wanted, is a separate collection.

## Why federated and not central

- **Data locality and ownership.** Each project's content already lives in its
  own database. Keeping its embeddings next to it (Plone's own Postgres) means
  no content leaves the project boundary just to be indexed. The assistant
  never becomes a second copy of everyone's content.
- **Isolation is structural, not a WHERE clause.** With a central store,
  tenant isolation is one forgotten `tenant_id` filter away from a leak. With
  federation, `tenant=recetia` physically routes to a different backend and
  literally cannot see Estades Delta's vectors.
- **Reuses M1 work.** Estades Delta already has the pgvector adapter, the
  schema, the Celery queue, and the dependency. Reviving it is less work than
  building a central ingestion pipeline the assistant currently lacks
  entirely (there is no `add_documents` caller, endpoint, or command in the
  package today).
- **Heterogeneous stores are fine.** Recetia's original design targeted Chroma
  + sentence-transformers; Estades Delta uses pgvector + Ollama embeddings.
  Federation lets each project keep the store that fits it, behind one uniform
  `search` contract (ADR 024). A central store would force one embedding model
  and one vector engine on everyone.

## Trade-offs we accepted

- **Every project must implement the search endpoint.** A new tenant isn't
  "free" — it has to expose a `search(query) → chunks` endpoint over its own
  store and run its own embedding computation. This is the cost of ownership;
  we judge it worth paying for isolation and locality.
- **No cross-project retrieval.** The assistant cannot answer a question by
  blending chunks from two tenants. That's a non-goal — tenants are
  independent businesses.
- **Embedding-model consistency is per-project, not global.** Query embeddings
  must be produced by the same model the tenant indexed with. The `search`
  contract therefore takes the *query text* (the tenant embeds it), not a
  pre-computed vector, so the model choice stays entirely inside the tenant.
- **The assistant can't warm a cache of vectors.** Each turn pays a network
  hop to the tenant. Acceptable; retrieval latency is dominated by the LLM,
  not the hop.

## Consequences

- ADR 007 stands (pgvector, not Chroma) *for Estades Delta's own store*. Other
  tenants may differ; ADR 007 is no longer a global mandate, only Estades
  Delta's local choice.
- The assistant's missing `ChromaAdapter` is not built; it is replaced by the
  `RemoteSearchAdapter`. The package's `add_documents` path stays unused.
- Estades Delta gains: revived `embedding_store.py` (bootstrap `ensure_table`),
  a content indexer + Ollama embedding computation in
  `tasks/embeddings.py` (today `store_message_embedding` is orphaned and
  nothing computes embeddings), and a `@assistant-search` endpoint.
- The retrieval threshold ("no consta" floor) and citation shape are defined
  in ADR 024, not here.
