"""Inbound message processing pipeline.

When a guest message arrives (via webhook or direct), the pipeline:
  1. classify_and_respond — classify the message, generate a suggested response
  2. deliver_response — send the response (if autonomous mode + high-confidence FAQ)
     or notify the owner (assisted/manual mode)

Each step is a separate Celery task so we get retry, visibility, and the ability
to insert a human approval gate between classify and deliver.
"""

from __future__ import annotations

from estades.delta import logger
from estades.delta.adapters.llm import get_llm_adapter
from estades.delta.adapters.messaging import get_messaging_adapter
from estades.delta.celery_app import app


AUTONOMOUS_CONFIDENCE_THRESHOLD = 0.85


@app.task(name="estades.delta.tasks.pipeline.classify_and_respond", bind=True, max_retries=2)
def classify_and_respond(self, message_data: dict) -> dict:
    """Classify an inbound message and generate a suggested response.

    Args:
        message_data: {
            "message_uid": str,
            "conversation_uid": str,
            "body": str,
            "channel": str,
            "mode": str,  # manual | assisted | autonomous
            "property_context": dict,  # short_name, title, etc.
            "knowledge_base": dict,    # KB fields from the Property behavior
            "conversation_history": list[dict],  # [{direction, body}, ...]
        }

    Returns:
        Enriched dict with classification + suggested_response + action.
    """
    llm = get_llm_adapter()

    body = message_data["body"]
    property_context = message_data.get("property_context", {})
    knowledge_base = message_data.get("knowledge_base", {})
    conversation_history = message_data.get("conversation_history", [])
    mode = message_data.get("mode", "assisted")

    classification = llm.classify_message(body, property_context)

    language = llm.detect_language(body) if not classification.language else classification.language

    generation = llm.generate_response(
        message_body=body,
        classification=classification,
        knowledge_base=knowledge_base,
        conversation_history=conversation_history,
    )

    can_auto_send = (
        mode == "autonomous"
        and classification.label == "faq"
        and classification.confidence >= AUTONOMOUS_CONFIDENCE_THRESHOLD
    )

    result = {
        **message_data,
        "classification": classification.label,
        "classification_confidence": classification.confidence,
        "language_detected": language,
        "suggested_response": generation.text,
        "tokens_used": generation.tokens_used,
        "action": "auto_send" if can_auto_send else "await_approval",
    }

    logger.info(
        "Pipeline classify: msg=%s class=%s conf=%.2f action=%s",
        message_data.get("message_uid", "?"),
        classification.label,
        classification.confidence,
        result["action"],
    )

    if can_auto_send:
        deliver_response.delay(result)

    return result


@app.task(name="estades.delta.tasks.pipeline.deliver_response", bind=True, max_retries=3)
def deliver_response(self, enriched_data: dict) -> dict:
    """Deliver a response to the guest via the messaging adapter.

    Called automatically for autonomous FAQ responses, or manually by the
    owner-approval endpoint for assisted-mode responses.
    """
    messaging = get_messaging_adapter()

    channel = enriched_data.get("channel", "direct")
    guest_id = enriched_data.get("guest_external_id", "")
    body = enriched_data.get("suggested_response", "")
    language = enriched_data.get("language_detected", "en")

    if not body:
        logger.warning("deliver_response called with empty body, skipping")
        return {**enriched_data, "delivered": False, "delivery_reason": "empty_body"}

    result = messaging.send_message(
        channel=channel,
        recipient_id=guest_id,
        body=body,
        language=language,
    )

    logger.info(
        "Pipeline deliver: msg=%s channel=%s delivered=%s external_id=%s",
        enriched_data.get("message_uid", "?"),
        channel,
        result.delivered,
        result.external_id,
    )

    return {
        **enriched_data,
        "delivered": result.delivered,
        "delivery_external_id": result.external_id,
    }
