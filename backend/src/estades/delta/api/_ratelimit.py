"""Simple per-IP rate limiting for public endpoints, backed by Redis.

The assistant chat endpoint is guest-facing (anonymous), so it proxies to an
LLM on behalf of unauthenticated visitors — an abuse vector. Plone sees the
real client IP (the browser talks to Plone directly), so the limit lives here;
the downstream LLM service cannot rate-limit by visitor because every proxied
call arrives from Plone's IP.

Fixed-window counter: INCR a per-(scope, ip, window) key and EXPIRE it once.
Fails OPEN — if Redis is unreachable, requests are allowed rather than the
widget breaking for everyone. Bounded blast radius: only the LLM throttle
downstream and this counter gate abuse; neither is a security control.
"""

from __future__ import annotations

import os
import time

from estades.delta import logger


def _client_ip(request) -> str:
    """Best-effort real client IP.

    Behind Traefik/Cloudflare the real IP is the first entry of
    X-Forwarded-For; fall back to Zope's getClientAddr / REMOTE_ADDR. In local
    dev everything is 127.0.0.1, so the limit exists but doesn't separate
    visitors — correct mechanism, validated locally, effective in production.
    """
    xff = request.getHeader("X-Forwarded-For") if hasattr(request, "getHeader") else None
    if xff:
        return xff.split(",")[0].strip()
    getaddr = getattr(request, "getClientAddr", None)
    if callable(getaddr):
        addr = getaddr()
        if addr:
            return addr
    return request.get("REMOTE_ADDR", "unknown")


def _redis_client():
    url = os.environ.get("REDIS_URL", "")
    if not url:
        return None
    try:
        import redis

        return redis.from_url(url)
    except Exception as exc:  # noqa: BLE001 — fail open on any redis import/conn issue
        logger.warning("rate-limit: redis unavailable (%s); allowing request", exc)
        return None


def is_rate_limited(request, scope: str, limit: int, window_seconds: int) -> bool:
    """Return True if this client IP has exceeded `limit` per `window_seconds`.

    Fails open (returns False) when Redis is unavailable.
    """
    client = _redis_client()
    if client is None:
        return False

    ip = _client_ip(request)
    window = int(time.time()) // window_seconds
    key = f"ratelimit:{scope}:{ip}:{window}"
    try:
        count = client.incr(key)
        if count == 1:
            client.expire(key, window_seconds)
        return count > limit
    except Exception as exc:  # noqa: BLE001 — fail open on any redis error
        logger.warning("rate-limit: redis error (%s); allowing request", exc)
        return False
