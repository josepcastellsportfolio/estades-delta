"""POST /++api++/@approve-response — owner approves a suggested IA response.

The owner reviews the `ia_suggested_response` on a GuestMessage and
either approves it as-is or provides an edited version. This endpoint
creates the outbound GuestMessage and enqueues delivery.
"""

from __future__ import annotations

from datetime import datetime
from datetime import timezone

from estades.delta import logger
from plone.restapi.services import Service

import plone.api


class ApproveResponsePost(Service):

    def reply(self):
        data = self.request.get("BODY")
        if isinstance(data, bytes):
            import json

            data = json.loads(data)
        if not isinstance(data, dict):
            self.request.response.setStatus(400)
            return {"error": "Expected JSON object"}

        message_uid = data.get("message_uid")
        approved_text = data.get("approved_text")

        if not message_uid:
            self.request.response.setStatus(400)
            return {"error": "Missing 'message_uid'"}

        brains = plone.api.content.find(UID=message_uid)
        if not brains:
            self.request.response.setStatus(404)
            return {"error": f"Message {message_uid} not found"}

        original_message = brains[0].getObject()
        conversation = original_message.aq_parent

        response_body = approved_text or original_message.ia_suggested_response
        if not response_body:
            self.request.response.setStatus(400)
            return {"error": "No response text available"}

        current_user = plone.api.user.get_current()
        now = datetime.now(tz=timezone.utc)

        outbound = plone.api.content.create(
            container=conversation,
            type="GuestMessage",
            title=f"reply-{now.strftime('%Y%m%d%H%M%S')}",
            direction="outbound",
            body=response_body,
            ia_sent=False,
            human_approved_by=current_user.getId(),
        )

        conversation.last_activity = now
        outbound.reindexObject()
        conversation.reindexObject(idxs=["last_activity"])

        from estades.delta.tasks.pipeline import deliver_response

        deliver_response.delay({
            "message_uid": outbound.UID(),
            "conversation_uid": conversation.UID(),
            "channel": conversation.channel or "direct",
            "guest_external_id": conversation.guest_external_id or "",
            "suggested_response": response_body,
            "language_detected": original_message.language_detected or "en",
        })

        logger.info(
            "Approved response: outbound %s in conversation %s by %s",
            outbound.UID(),
            conversation.UID(),
            current_user.getId(),
        )

        self.request.response.setStatus(201)
        return {
            "status": "approved",
            "outbound_uid": outbound.UID(),
            "conversation_uid": conversation.UID(),
        }
