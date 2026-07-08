"""POST /++api++/@assistant-chat — browser→Plone→assistant chat proxy.

The outward half of the assistant integration (ADR-024 contract A, consumed
side). A logged-in editor's browser calls this same-origin, so Plone's own auth
cookie authenticates the request — no JWT in the browser. Plone then forwards
the turn to the shared assistant service, authenticating as a *service* with a
shared token and forwarding the editor's identity + tenant so the assistant's
per-(tenant, user) session isolation still holds (ADR-023).

This keeps the JWT-only assistant service off the public browser surface: the
only thing the browser talks to is Plone, which it already trusts.

Body:  {query: str, session_id?: str}
Reply: the assistant's chat response verbatim
       {session_id, response, agent_type, structured_data, sources, ...}

Config (env):
  ASSISTANT_CHAT_URL     internal URL of the assistant chat endpoint
                         (default http://assistant:8080/api/v1/assistant/chat/)
  ASSISTANT_SERVICE_TOKEN shared token presented as X-Assistant-Token
  ASSISTANT_TENANT_ID    tenant slug forwarded as X-Tenant-Id (default estades-delta)
"""

from __future__ import annotations

import json
import os
import zlib

from estades.delta import logger
from plone.restapi.services import Service

import httpx
import plone.api


DEFAULT_CHAT_URL = "http://assistant:8080/api/v1/assistant/chat/"
DEFAULT_TENANT = "estades-delta"
TIMEOUT_SECONDS = float(os.environ.get("ASSISTANT_CHAT_TIMEOUT", "120"))


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

    def reply(self):
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

        chat_url = os.environ.get("ASSISTANT_CHAT_URL", DEFAULT_CHAT_URL)
        token = os.environ.get("ASSISTANT_SERVICE_TOKEN", "")
        tenant = os.environ.get("ASSISTANT_TENANT_ID", DEFAULT_TENANT)
        headers = {
            "Content-Type": "application/json",
            "X-Tenant-Id": tenant,
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
