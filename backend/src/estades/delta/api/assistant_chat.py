"""POST /++api++/@assistant-chat — browser→Plone→assistant chat proxy.

The outward half of the assistant integration (ADR-024 contract A, consumed
side). GUEST-facing: an anonymous visitor on a property microsite calls this
same-origin and asks about the property. Plone forwards the turn to the shared
assistant service, authenticating as a *service* with this tenant's own token
and forwarding the visitor's identity (0 for anonymous). The tenant is not
forwarded: the assistant derives it from the token (ADR-023). This keeps the
JWT-only assistant service off the public browser surface — the only thing the
browser talks to is Plone.

Because it's public and proxies an LLM, it is abuse-gated by a per-IP rate
limit (Plone sees the real client IP; the downstream service does not). The
optional `source_uid` scopes RAG to the property being viewed, validated to be
a published object so a guest can't probe unpublished content.

Body:  {query: str, session_id?: str, source_uid?: str}
Reply: the assistant's chat response verbatim
       {session_id, response, agent_type, structured_data, sources, ...}

Config (env):
  ASSISTANT_CHAT_URL      internal URL of the assistant chat endpoint
                          (default http://assistant:8080/api/v1/assistant/chat/)
  ASSISTANT_INBOUND_TOKEN this tenant's own token, presented as X-Assistant-Token.
                          Preferred. It is what identifies us to the assistant.
  ASSISTANT_SERVICE_TOKEN legacy shared token, used only if the above is unset.
                          Deprecated: it is shared by every consumer, cannot be
                          rotated per project, and resolves to NO tenant on the
                          assistant side, so our sessions land outside the
                          `estades-delta` scope and our RAG is never routed
                          through the tenant registry.
  ASSISTANT_CHAT_RATE_LIMIT / _WINDOW  per-IP requests per window seconds

Note there is no X-Tenant-Id: the assistant ignores it. Our tenant is derived
from the token we present, which is why the inbound token matters.
"""

from __future__ import annotations

import json
import os
import zlib

from estades.delta import logger
from estades.delta.api._ratelimit import is_rate_limited
from plone.restapi.services import Service

import httpx
import plone.api


DEFAULT_CHAT_URL = "http://assistant:8080/api/v1/assistant/chat/"
TIMEOUT_SECONDS = float(os.environ.get("ASSISTANT_CHAT_TIMEOUT", "120"))
# Per-IP rate limit for the public guest widget (abuse control for the anon
# LLM endpoint). Tunable via env; generous enough for a real conversation.
RATE_LIMIT = int(os.environ.get("ASSISTANT_CHAT_RATE_LIMIT", "20"))
RATE_WINDOW = int(os.environ.get("ASSISTANT_CHAT_RATE_WINDOW", "60"))


def _forwarded_user_id() -> int:
    """Map the current Plone user (a string id) to a stable positive int.

    The assistant keys sessions by an int user_id; Plone ids are strings. A
    CRC32 of the login id gives a stable, collision-negligible int scoped to
    this tenant. Anonymous → 0.
    """
    user = plone.api.user.get_current()
    login = user.getId() if user is not None else None
    if not login:
        return 0
    return zlib.crc32(login.encode("utf-8")) & 0x7FFFFFFF


class AssistantChatPost(Service):

    @staticmethod
    def _is_published_uid(uid: str) -> bool:
        """True if `uid` is a published content object (guest-visible)."""
        try:
            brains = plone.api.content.find(UID=uid, review_state="published")
        except Exception:  # noqa: BLE001 — bad UID / catalog hiccup → treat as not scoped
            return False
        return len(brains) > 0

    def reply(self):
        # Per-IP abuse gate for the public guest endpoint.
        if is_rate_limited(self.request, "assistant-chat", RATE_LIMIT, RATE_WINDOW):
            self.request.response.setStatus(429)
            return {"error": "Too many requests. Please slow down."}

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

        payload = {"query": query}
        session_id = data.get("session_id")
        if session_id:
            payload["session_id"] = session_id
        # Property scope: constrain RAG to the content the visitor is viewing.
        # Only honour a UID that resolves to a *published* object, so a guest
        # can't probe unpublished content by guessing UIDs.
        source_uid = data.get("source_uid")
        if source_uid and self._is_published_uid(source_uid):
            payload["source_uid"] = source_uid

        chat_url = os.environ.get("ASSISTANT_CHAT_URL", DEFAULT_CHAT_URL)
        # Our own inbound token first; the shared one only while migrating.
        # The assistant derives our tenant from whichever we present, so the
        # legacy token silently scopes us to "no tenant" rather than to
        # `estades-delta`.
        token = os.environ.get("ASSISTANT_INBOUND_TOKEN", "") or os.environ.get(
            "ASSISTANT_SERVICE_TOKEN", ""
        )
        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-User": str(_forwarded_user_id()),
        }
        if token:
            headers["X-Assistant-Token"] = token

        try:
            resp = httpx.post(
                chat_url, json=payload, headers=headers, timeout=TIMEOUT_SECONDS
            )
        except httpx.HTTPError as exc:
            logger.warning("assistant-chat: service unreachable: %s", exc)
            self.request.response.setStatus(502)
            return {"error": "Assistant service unreachable"}

        if resp.status_code >= 400:
            logger.warning(
                "assistant-chat: service returned %d: %s",
                resp.status_code, resp.text[:200],
            )
            self.request.response.setStatus(502)
            return {"error": f"Assistant service error ({resp.status_code})"}

        logger.info("assistant-chat: query=%r -> ok", query[:80])
        # Pass the assistant's response through verbatim.
        return resp.json()
