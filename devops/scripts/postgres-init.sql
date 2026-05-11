-- Estades Delta — Postgres init for Phase 1 (local dev)
--
-- Runs once on first container start (volume empty). Creates:
--   1. The vector extension (pgvector).
--   2. A dedicated schema for Plone RelStorage (relstorage tables and blobs).
--   3. A dedicated schema for embeddings / RAG (used by the future assistant service).
--   4. A schema for Umami analytics (created lazily when Umami first connects, but reserved
--      here to avoid name collisions).
--
-- Schemas keep concerns separate so we can grant least-privilege access later and back up
-- selectively. Default search_path stays at "$user, public" — RelStorage reads its config
-- from the DSN, so we point it explicitly at the plone_zodb schema in docker-compose.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS plone_zodb AUTHORIZATION plone;
CREATE SCHEMA IF NOT EXISTS embeddings AUTHORIZATION plone;
CREATE SCHEMA IF NOT EXISTS umami AUTHORIZATION plone;

COMMENT ON SCHEMA plone_zodb IS 'RelStorage tables for the Plone ZODB';
COMMENT ON SCHEMA embeddings IS 'pgvector embeddings for the assistant service (Phase 2+)';
COMMENT ON SCHEMA umami    IS 'Umami analytics (Phase 1+, reserved)';
