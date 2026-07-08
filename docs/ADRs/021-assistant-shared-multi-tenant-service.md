# ADR 021 — Assistant as a shared multi-tenant service (not a per-project fork)

**Status:** accepted
**Date:** 2026-07-07
**Supersedes:** ADR 008 (the "fork `recetia_assistant` per project" strategy)
**Related:** ADR 022 (federated vector store), ADR 023 (tenancy model), ADR 024 (API contract)

## Context

The original plan (ADR 008, and CLAUDE.md §5.3 / §10 / §12) was to **fork**
`recetia_assistant` into an `estades_assistant`, adapt its adapters to Plone,
and run it as a separate Django microservice bound to Estades Delta. The
rationale at the time was "validate demand first, extract a generic core
later — never touch the upstream."

Two things changed that make forking the wrong call now:

- **`recetia_assistant` is already a clean hexagonal Django app package**
  (`domain/ application/ ports/ adapters/ api/`), with every backend plugged
  in by dotted-path config (`conf.py` + `registry.py`). Its extension seams
  (`VectorStorePort`, `DomainDataPort`, `LLMPort`, `SessionPort`) are exactly
  the seams a second consumer needs. The "extract a generic core later" step
  the fork strategy deferred is cheaper to do *now, once* than to pay as a
  per-project fork-and-diverge tax forever.
- **The studio runs several projects** (Estades Delta / Plone, Recetia,
  Ebrebook, Wolfpack, …) that each want the same assistant capability. A fork
  per project means N copies of the same core drifting apart, N sets of
  security fixes, N deployments to reason about.

## Decision

We build **one shared, multi-tenant assistant service** that every project
consumes over HTTP, instead of forking the package per project.

- The service is the `recetia_assistant` package (renamed generically at the
  package level is optional and out of scope here) mounted in a **minimal host
  Django project** with `manage.py`, settings, a Dockerfile, and an entry in
  the deltransform `docker-compose`.
- Projects are **tenants** of this one service (see ADR 023). A tenant is a
  project slug (`estades-delta`, `recetia`, …). Sessions and messages are
  namespaced by `tenant_id`; there is no per-project code.
- The LLM stays **self-hosted Ollama/Llama** (the package already ships
  `OllamaAdapter` as default). This supersedes the "Claude Haiku 4.5 default"
  row of ADR 009 for this service. Claude via `ClaudeAdapter` remains a
  config-only option if a quality-sensitive feature later justifies the cost.
- We work **through the existing ports**, adding adapters — we do not fork or
  rewrite the hexagonal core.

## Why not fork (the ADR-008 path)

- **Maintenance multiplies.** A security fix in the DRF views (the ownership
  404-not-403 anti-enumeration logic, throttling scopes) would have to be
  re-applied to every fork. One service, one fix.
- **The generic core already exists.** ADR 008's premise was that a generic
  core would have to be *extracted* someday; the package is already generic by
  construction. Forking to specialize it and then re-generalizing is wasted
  motion.
- **Tenancy is a smaller change than a fork.** Adding a `tenant_id` dimension
  (ADR 023) is one migration plus routing; a fork is a whole parallel
  codebase.

## Why one service and not one library-per-project

Embedding the package directly into each project's own runtime (e.g. into the
Plone process) was considered. Rejected because:

- Estades Delta's backend is **Plone (Python/Zope)**, not Django. The package
  is a Django app; it cannot mount inside Plone. A separate service is
  required regardless, so "one shared service" costs nothing extra over "one
  service just for Estades Delta."
- A shared service gives a single place to hold conversation history,
  throttling, and the LLM connection pool.

## Trade-offs we accepted

- **A shared service is a single point of failure** for the assistant feature
  across projects. Acceptable in Phase 1 (no project is in production yet);
  revisit for HA when the first tenant goes live.
- **Tenants must authenticate to the service** (service token per tenant, ADR
  023) — a small amount of new plumbing versus a fork's zero-auth in-process
  calls.
- **The package keeps its `recetia_` name** for now. Renaming to a neutral
  namespace is a future cosmetic change, not a blocker.

## Consequences

- CLAUDE.md §5.3, §10, §12, §14 are updated: the assistant is a shared
  multi-tenant service on Ollama, not a Claude-Haiku Django fork. The "never
  touch upstream / always fork to `estades_assistant`" instruction in §13 is
  withdrawn.
- Estades Delta becomes the **first tenant** and the pilot for the end-to-end
  wiring (ADR 024, and the Phase 3 pilot in the working plan).
- Vector ownership is decided separately and federated, not centralized in
  this service — see ADR 022.
