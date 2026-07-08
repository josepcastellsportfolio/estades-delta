# ADR 023 — Assistant tenancy model

**Status:** accepted
**Date:** 2026-07-07
**Related:** ADR 021 (shared service), ADR 022 (federated vectors), ADR 024 (API contract)

## Context

ADR 021 makes the assistant a single service shared by several projects. The
package as it stands has **no tenancy concept**: sessions and messages are
isolated only by `user_id` (a plain int, deliberately not an FK), all in one
`assistant` database. There is no `tenant_id`, `project_id`, or namespace
anywhere in the models or the API.

We need a tenancy dimension that (a) namespaces conversation state per project,
(b) decides which backend the RAG search is routed to (ADR 022 federation),
and (c) authenticates a project to the service.

## Decision

**A tenant is a project slug.** We add `tenant_id` (a short string:
`estades-delta`, `recetia`, …) as the primary namespacing dimension.

- **Sessions and messages** gain a `tenant_id` column
  (`AssistantChatSession`, `AssistantChatMessage`) via a migration. Every
  query is scoped by `(tenant_id, user_id)`. Isolation is therefore per tenant
  *and* per user, preserving the existing per-user ownership checks (the
  404-not-403 anti-enumeration behavior stays).
- **Routing.** `tenant_id` selects the tenant's backend base URL and search
  endpoint from a server-side **tenant registry** (config/env in the host
  Django project — no tenant coordinates in client requests). The
  `RemoteSearchAdapter` (ADR 022) uses this to know *where* to search.
- **Authentication.** Each tenant holds a **service token** (per tenant, not
  per user) it presents to the assistant. The token resolves to a `tenant_id`
  server-side; a request can never assert a `tenant_id` it isn't
  authenticated for. End-user identity within a tenant is still carried
  separately (the existing JWT `user_id`), so both dimensions apply.
- **The `user_id` stays a plain int** scoped within a tenant. `user_id` 42 in
  `estades-delta` and `user_id` 42 in `recetia` are different people; the
  `(tenant_id, user_id)` pair is the identity.

## Why a slug and not an FK to a Tenant table

- The assistant deliberately does **not** own the user or project directory —
  it decouples from host models (that's why `user_id` is an int, not an FK).
  Keeping `tenant_id` a slug preserves that decoupling: the assistant needs no
  join into any project's schema.
- The set of tenants is small and changes rarely (a handful of studio
  projects). A server-side registry keyed by slug is simpler than a managed
  table with its own CRUD.

## Why per-tenant service tokens (not per-user, not open)

- The RAG search hop (ADR 022) is **service-to-service**: the assistant calls
  the tenant's backend, and the tenant's backend calls back with content. That
  trust is between *services*, established once per tenant, not per end user.
- Making `tenant_id` derive from the token (never from request body) closes
  the obvious cross-tenant escalation: a compromised or buggy client cannot
  read another tenant's sessions or trigger a search against another tenant's
  store.

## Trade-offs we accepted

- **A migration touches existing rows.** Recetia's existing sessions (if any)
  get back-filled with `tenant_id='recetia'` in the migration. Bounded,
  one-time.
- **Tenant onboarding is a config step**, not self-serve: add the slug, base
  URL, and a token to the registry. Fine for a studio-operated set of
  projects; not a public multi-tenant SaaS.
- **Two identity dimensions** (`tenant_id` from service token + `user_id` from
  JWT) is slightly more to reason about than one. The payoff is that neither
  end users nor tenants can cross their boundary.

## Consequences

- `adapters/django/models.py` gains `tenant_id` on session and message; one
  migration.
- The host Django project holds the tenant registry (slug → base URL + token
  hash) and the token-auth layer that maps an inbound service token to a
  `tenant_id`.
- The DRF views scope every session/message query by `tenant_id` in addition
  to the existing per-user ownership check.
- Vector isolation is already structural via federation (ADR 022); `tenant_id`
  here governs *conversation* isolation and *search routing*.
