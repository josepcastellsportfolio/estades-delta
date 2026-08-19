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

---

## Amendment (2026-08-19) — how `user_id` actually arrives

Recorded after an isolation audit of the assistant service. The decision above
stands; this corrects the record of **how the second identity dimension is
carried**, which the implementation resolved differently.

This ADR says `user_id` comes from the JWT — "the existing JWT `user_id`" under
*Decision*, and "`user_id` from JWT" under *Trade-offs we accepted*. That is true
for a browser talking to the service directly. It is **not** true for the
proxied path this project actually uses.

Estades Delta proxies chat through Plone, which holds no per-user JWT for the
assistant. It authenticates as a *service* and forwards the end user in a plain
header:

- `X-Assistant-Token` — the tenant credential. `tenant_id` is derived from it and
  from nothing else. This half matches the ADR exactly.
- `X-Forwarded-User` — the end user's id, **an unsigned header set by the proxy**
  (`backend/src/estades/delta/api/assistant_chat.py:117`, derived server-side
  from `plone.api.user.get_current()`).

### What follows from that

- Only **one** of the two dimensions is a proven credential. The tenant is; the
  user is asserted by the tenant's backend.
- So a tenant's backend can act as **any of its own users**, and its user ids are
  guessable — this project derives them as `crc32(login)`. It cannot reach
  another tenant's users, because the tenant still comes from the token.
- That is the inherent trust model of a service-to-service proxy and is
  **accepted**: the tenant's backend is already the authority on who its users
  are. It was simply never written down as a residual risk, which is what this
  amendment fixes.
- The claim in *Trade-offs* that "neither end users nor tenants can cross their
  boundary" holds **between tenants**. Within one tenant it rests on that
  tenant's backend being uncompromised, not on cryptography.

Not a decision to revisit here. Making the user dimension provable would mean
per-user tokens minted by the tenant, which is a different ADR.

See `INTEGRATION.md` in the assistant repo for the header contract, and
`api/authentication.py` for where the tenant is resolved.
