"""External-system adapters for estades.delta.

Phase 1: stubs only — they log calls and return mock data so we can wire the rest
of the system end-to-end without registering real Beds24 / Stripe accounts.

The real implementations land in Phase 2 (Beds24 sandbox + Stripe Connect sandbox)
and Phase 3 (production credentials). See CLAUDE.md section 10.
"""
