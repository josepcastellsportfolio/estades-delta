"""LLM adapter — abstracts the language model behind a sync Protocol.

Phase 1 ships two implementations:
  - OllamaAdapter: hits the local Ollama HTTP API (llama3.1:8b-instruct).
  - MockLLMAdapter: deterministic responses for tests and offline dev.

The factory `get_llm_adapter()` picks the right one based on LLM_BASE_URL.
"""

from __future__ import annotations

import os

from dataclasses import dataclass
from estades.delta import logger
from typing import Protocol
from typing import runtime_checkable

import httpx


@dataclass(frozen=True)
class ClassificationResult:
    label: str  # faq | urgent | team_query | other
    confidence: float
    language: str  # ISO 639-1


@dataclass(frozen=True)
class GenerationResult:
    text: str
    tokens_used: int


@runtime_checkable
class ILLMAdapter(Protocol):

    def classify_message(self, body: str, property_context: dict) -> ClassificationResult:
        """Classify an inbound guest message."""
        ...

    def generate_response(
        self,
        message_body: str,
        classification: ClassificationResult,
        knowledge_base: dict,
        conversation_history: list[dict],
    ) -> GenerationResult:
        """Generate a suggested response for an inbound message."""
        ...

    def detect_language(self, text: str) -> str:
        """Return ISO 639-1 code for the dominant language in `text`."""
        ...


_CLASSIFY_SYSTEM = """\
You are a message classifier for a vacation rental property in the Ebro Delta.
Classify the guest message into exactly one of: faq, urgent, team_query, other.
Also detect the language (ISO 639-1 code).
Respond ONLY with JSON: {"label": "...", "confidence": 0.0-1.0, "language": "..."}"""

_RESPOND_SYSTEM = """\
You are a helpful assistant for a vacation rental property in the Ebro Delta.
Use ONLY the knowledge base provided. Do NOT invent information.
Reply in the same language as the guest message. Keep it concise and warm."""


class OllamaAdapter:
    """Hits the Ollama HTTP API for chat completions."""

    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
    ):
        self._base_url = (base_url or os.environ.get("LLM_BASE_URL", "http://ollama:11434")).rstrip("/")
        self._model = model or os.environ.get("LLM_MODEL", "llama3.1:8b-instruct")
        self._timeout = timeout or float(os.environ.get("LLM_TIMEOUT_SECONDS", "30"))

    def _chat(self, system: str, user: str) -> str:
        url = f"{self._base_url}/api/chat"
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "options": {"temperature": 0.3},
        }
        resp = httpx.post(url, json=payload, timeout=self._timeout)
        resp.raise_for_status()
        return resp.json()["message"]["content"]

    def classify_message(self, body: str, property_context: dict) -> ClassificationResult:
        import json as _json

        context_str = _json.dumps(property_context, ensure_ascii=False)
        prompt = f"Property context:\n{context_str}\n\nGuest message:\n{body}"
        raw = self._chat(_CLASSIFY_SYSTEM, prompt)
        try:
            data = _json.loads(raw)
            return ClassificationResult(
                label=data.get("label", "other"),
                confidence=float(data.get("confidence", 0.0)),
                language=data.get("language", "en"),
            )
        except (_json.JSONDecodeError, ValueError, KeyError):
            logger.warning("LLM classify parse failed, raw=%s", raw[:200])
            return ClassificationResult(label="other", confidence=0.0, language="en")

    def generate_response(
        self,
        message_body: str,
        classification: ClassificationResult,
        knowledge_base: dict,
        conversation_history: list[dict],
    ) -> GenerationResult:
        import json as _json

        history_str = "\n".join(
            f"[{m['direction']}] {m['body']}" for m in conversation_history[-6:]
        )
        kb_str = _json.dumps(knowledge_base, ensure_ascii=False)
        prompt = (
            f"Knowledge base:\n{kb_str}\n\n"
            f"Conversation so far:\n{history_str}\n\n"
            f"Latest guest message ({classification.label}, "
            f"confidence={classification.confidence:.2f}):\n{message_body}"
        )
        text = self._chat(_RESPOND_SYSTEM, prompt)
        return GenerationResult(text=text.strip(), tokens_used=0)

    def detect_language(self, text: str) -> str:
        raw = self._chat(
            "Detect the language of the following text. Respond with ONLY the ISO 639-1 code.",
            text,
        )
        code = raw.strip().lower()[:2]
        return code if len(code) == 2 and code.isalpha() else "en"


class MockLLMAdapter:
    """Deterministic adapter for tests and offline development."""

    def classify_message(self, body: str, property_context: dict) -> ClassificationResult:
        body_lower = body.lower()
        if any(w in body_lower for w in ("wifi", "password", "contrasenya", "clau")):
            return ClassificationResult(label="faq", confidence=0.95, language="en")
        if any(w in body_lower for w in ("emergency", "urgent", "help", "broken", "leak")):
            return ClassificationResult(label="urgent", confidence=0.90, language="en")
        return ClassificationResult(label="other", confidence=0.50, language="en")

    def generate_response(
        self,
        message_body: str,
        classification: ClassificationResult,
        knowledge_base: dict,
        conversation_history: list[dict],
    ) -> GenerationResult:
        if classification.label == "faq":
            wifi = knowledge_base.get("wifi_ssid", "DeltaWiFi")
            pwd = knowledge_base.get("wifi_password", "guest1234")
            return GenerationResult(
                text=f"The WiFi network is '{wifi}' and the password is '{pwd}'.",
                tokens_used=0,
            )
        return GenerationResult(
            text="Thank you for your message. The property owner will get back to you shortly.",
            tokens_used=0,
        )

    def detect_language(self, text: str) -> str:
        return "en"


def get_llm_adapter() -> ILLMAdapter:
    """Factory: returns OllamaAdapter if LLM_BASE_URL is set, else Mock."""
    base_url = os.environ.get("LLM_BASE_URL", "")
    if base_url:
        return OllamaAdapter(base_url=base_url)
    logger.info("LLM_BASE_URL not set — using MockLLMAdapter")
    return MockLLMAdapter()
