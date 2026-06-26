"""Tests for the messaging pipeline tasks.

These call the task functions directly (no Celery broker needed) with
the MockLLMAdapter and StubMessagingAdapter injected via env vars.
"""

import pytest


@pytest.fixture(autouse=True)
def _mock_env(monkeypatch):
    """Force mock adapters by unsetting LLM_BASE_URL and MESSAGING_ADAPTER."""
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.setenv("MESSAGING_ADAPTER", "stub")


def _make_message_data(**overrides):
    base = {
        "message_uid": "test-msg-001",
        "conversation_uid": "test-conv-001",
        "body": "What is the wifi password?",
        "channel": "direct",
        "mode": "assisted",
        "guest_external_id": "guest-ext-1",
        "property_context": {"short_name": "casa-demo", "title": "Casa Demo"},
        "knowledge_base": {"wifi_ssid": "DeltaNet", "wifi_password": "secret123"},
        "conversation_history": [],
    }
    base.update(overrides)
    return base


def test_classify_and_respond_faq():
    from estades.delta.tasks.pipeline import classify_and_respond

    data = _make_message_data()
    result = classify_and_respond(data)

    assert result["classification"] == "faq"
    assert result["classification_confidence"] >= 0.9
    assert "DeltaNet" in result["suggested_response"]
    assert result["action"] == "await_approval"


def test_classify_and_respond_autonomous_faq():
    from unittest.mock import patch

    from estades.delta.tasks.pipeline import classify_and_respond

    data = _make_message_data(mode="autonomous")

    with patch("estades.delta.tasks.pipeline.deliver_response") as mock_deliver:
        result = classify_and_respond(data)

    assert result["action"] == "auto_send"
    mock_deliver.delay.assert_called_once()


def test_classify_and_respond_non_faq():
    from estades.delta.tasks.pipeline import classify_and_respond

    data = _make_message_data(body="What time is checkout tomorrow?")
    result = classify_and_respond(data)

    assert result["classification"] == "other"
    assert result["action"] == "await_approval"


def test_deliver_response_sends_via_stub():
    from estades.delta.tasks.pipeline import deliver_response

    enriched = {
        "message_uid": "test-msg-001",
        "channel": "direct",
        "guest_external_id": "guest-ext-1",
        "suggested_response": "The WiFi is DeltaNet / secret123.",
        "language_detected": "en",
    }
    result = deliver_response(enriched)

    assert result["delivered"] is True
    assert result["delivery_external_id"]


def test_deliver_response_skips_empty_body():
    from estades.delta.tasks.pipeline import deliver_response

    enriched = {
        "message_uid": "test-msg-002",
        "channel": "direct",
        "guest_external_id": "",
        "suggested_response": "",
        "language_detected": "en",
    }
    result = deliver_response(enriched)

    assert result["delivered"] is False
    assert result["delivery_reason"] == "empty_body"
