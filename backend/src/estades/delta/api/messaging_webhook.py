"""POST /++api++/@messaging-webhook — inbound guest message receiver.

Accepts messages from external channels (Beds24, WhatsApp Business API)
or direct form submissions. Validates HMAC signature when configured,
creates the GuestMessage in Plone, and kicks off the classify pipeline.
"""

from __future__ import annotations

import hashlib
import hmac
import os

from datetime import datetime
from datetime import timezone

from estades.delta import logger
from plone.restapi.services import Service

import plone.api


class MessagingWebhookPost(Service):

    def reply(self):
        raw_body = self.request.get("BODY")

        secret = os.environ.get("WEBHOOK_HMAC_SECRET", "")
        if secret:
            signature = self.request.getHeader("X-Webhook-Signature") or ""
            if not self._verify_hmac(raw_body, secret, signature):
                self.request.response.setStatus(403)
                return {"error": "Invalid signature"}

        if isinstance(raw_body, bytes):
            import json

            data = json.loads(raw_body)
        else:
            data = raw_body
        if not isinstance(data, dict):
            self.request.response.setStatus(400)
            return {"error": "Expected JSON object"}

        body = data.get("body", "").strip()
        if not body:
            self.request.response.setStatus(400)
            return {"error": "Missing 'body' field"}

        channel = data.get("channel", "direct")
        external_message_id = data.get("external_message_id")
        booking_uid = data.get("booking_uid")
        guest_external_id = data.get("guest_external_id", "")

        if external_message_id:
            existing = plone.api.content.find(
                portal_type="GuestMessage",
                external_message_id=external_message_id,
            )
            if existing:
                return {"status": "duplicate", "message_uid": existing[0].UID}

        if not booking_uid:
            self.request.response.setStatus(400)
            return {"error": "Missing 'booking_uid' — cannot locate conversation"}

        booking_brains = plone.api.content.find(UID=booking_uid)
        if not booking_brains:
            self.request.response.setStatus(404)
            return {"error": f"Booking {booking_uid} not found"}

        booking = booking_brains[0].getObject()
        conversation = self._get_or_create_conversation(
            booking, channel, guest_external_id
        )
        now = datetime.now(tz=timezone.utc)

        message = plone.api.content.create(
            container=conversation,
            type="GuestMessage",
            title=f"msg-{now.strftime('%Y%m%d%H%M%S')}",
            direction="inbound",
            body=body,
            external_message_id=external_message_id or "",
        )

        conversation.last_activity = now
        message.reindexObject()
        conversation.reindexObject(idxs=["last_activity"])

        from estades.delta.tasks.pipeline import classify_and_respond

        property_obj = booking.aq_parent
        kb = self._extract_knowledge_base(property_obj)
        history = self._build_conversation_history(conversation)

        classify_and_respond.delay({
            "message_uid": message.UID(),
            "conversation_uid": conversation.UID(),
            "body": body,
            "channel": channel,
            "mode": conversation.mode or "assisted",
            "guest_external_id": guest_external_id,
            "property_context": {
                "short_name": getattr(property_obj, "short_name", ""),
                "title": property_obj.Title(),
            },
            "knowledge_base": kb,
            "conversation_history": history,
        })

        logger.info(
            "Webhook: created msg %s in conversation %s",
            message.UID(),
            conversation.UID(),
        )

        self.request.response.setStatus(201)
        return {
            "status": "accepted",
            "message_uid": message.UID(),
            "conversation_uid": conversation.UID(),
        }

    def _verify_hmac(self, raw_body, secret: str, signature: str) -> bool:
        if isinstance(raw_body, str):
            raw_body = raw_body.encode()
        expected = hmac.HMAC(
            secret.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    def _get_or_create_conversation(self, booking, channel: str, guest_external_id: str):
        for obj_id in booking.objectIds():
            obj = booking[obj_id]
            if obj.portal_type == "GuestConversation" and obj.channel == channel:
                return obj

        conversation = plone.api.content.create(
            container=booking,
            type="GuestConversation",
            title=f"conv-{channel}",
            channel=channel,
            guest_external_id=guest_external_id,
            mode="assisted",
        )
        return conversation

    def _extract_knowledge_base(self, property_obj) -> dict:
        kb = {}
        for field_name in (
            "wifi_ssid", "wifi_password", "parking_instructions",
            "check_in_instructions", "check_out_instructions",
            "house_rules_kb", "local_recommendations", "emergency_contacts",
        ):
            val = getattr(property_obj, field_name, None)
            if val is not None:
                if hasattr(val, "raw"):
                    val = val.raw
                kb[field_name] = val
        approved_facts = getattr(property_obj, "kb_approved_facts", None)
        if approved_facts:
            kb["approved_facts"] = approved_facts
        return kb

    def _build_conversation_history(self, conversation) -> list[dict]:
        messages = []
        for obj_id in conversation.objectIds():
            msg = conversation[obj_id]
            if msg.portal_type == "GuestMessage":
                messages.append({
                    "direction": msg.direction,
                    "body": msg.body or "",
                })
        return messages[-10:]
