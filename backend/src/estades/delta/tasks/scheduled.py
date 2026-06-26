"""Scheduled messaging tasks — driven by Celery beat.

These tasks scan for upcoming check-ins and enqueue welcome/pre-checkin/
post-checkin messages at the right time. Messages are rendered from
Jinja2 templates using the Property's knowledge base fields.

Templates are plain-text (autoescape=False) — safe for SMS/WhatsApp
channels. If an HTML channel is added, the messaging adapter MUST
escape content before delivery.
"""

from __future__ import annotations

from datetime import date
from datetime import datetime
from datetime import timedelta
from datetime import timezone

from estades.delta import logger
from estades.delta.adapters.messaging import get_messaging_adapter
from estades.delta.celery_app import app
from estades.delta.templates import render_message


VALID_MESSAGE_TYPES = ("welcome", "pre_checkin", "post_checkin")


@app.task(name="estades.delta.tasks.scheduled.scan_upcoming_checkins")
def scan_upcoming_checkins() -> dict:
    """Scan confirmed bookings and enqueue due scheduled messages.

    Enqueues messages unconditionally — dedup happens inside
    send_scheduled_message (at-most-once via ZODB annotations).
    """
    try:
        from estades.delta.zope_context import plone_context
    except ImportError:
        logger.warning("scan_upcoming_checkins: Zope not available, skipping")
        return {"scanned": 0, "enqueued": 0}

    try:
        import plone.api

        with plone_context() as (_app, portal):
            today = date.today()
            tomorrow = today + timedelta(days=1)
            yesterday = today - timedelta(days=1)

            bookings = plone.api.content.find(
                portal_type="Booking",
                review_state="confirmed",
            )

            scanned = 0
            enqueued = 0

            for brain in bookings:
                scanned += 1
                try:
                    booking = brain.getObject()
                except Exception:
                    continue

                check_in = getattr(booking, "check_in_date", None)
                if not check_in:
                    continue

                if isinstance(check_in, datetime):
                    check_in = check_in.date()

                property_obj = booking.aq_parent
                kb = _extract_kb(property_obj)

                guest_lang = getattr(booking, "guest_language", None) or "en"
                guest_name = _guest_name(booking)

                base_ctx = {
                    "booking_uid": booking.UID(),
                    "guest_name": guest_name,
                    "property_title": property_obj.Title(),
                    "check_in_date": str(check_in),
                    "check_out_date": str(getattr(booking, "check_out_date", "")),
                    "language": guest_lang,
                    **kb,
                }

                if check_in == tomorrow:
                    send_scheduled_message.delay(
                        booking.UID(), "pre_checkin", base_ctx
                    )
                    enqueued += 1

                elif check_in == today:
                    send_scheduled_message.delay(
                        booking.UID(), "welcome", base_ctx
                    )
                    enqueued += 1

                if check_in == yesterday:
                    send_scheduled_message.delay(
                        booking.UID(), "post_checkin", base_ctx
                    )
                    enqueued += 1

    except Exception:
        logger.exception("scan_upcoming_checkins failed")
        return {"scanned": 0, "enqueued": 0, "error": True}

    logger.info("scan_upcoming_checkins: scanned=%d enqueued=%d", scanned, enqueued)
    return {"scanned": scanned, "enqueued": enqueued}


@app.task(name="estades.delta.tasks.scheduled.send_scheduled_message")
def send_scheduled_message(
    booking_uid: str, message_type: str, template_context: dict
) -> dict:
    """Render and send a scheduled message (welcome, pre_checkin, post_checkin).

    Dedup: checks ZODB annotations on the Booking before sending (at-most-once).
    """
    if message_type not in VALID_MESSAGE_TYPES:
        logger.warning("Unknown message_type=%s, skipping", message_type)
        return {"booking_uid": booking_uid, "message_type": message_type, "sent": False}

    if _check_and_mark_sent(booking_uid, message_type):
        logger.info(
            "send_scheduled_message: %s/%s already sent, skipping",
            booking_uid,
            message_type,
        )
        return {"booking_uid": booking_uid, "message_type": message_type, "sent": False, "reason": "already_sent"}

    body = render_message(message_type, template_context)
    if not body:
        logger.warning("Empty template render for %s/%s", booking_uid, message_type)
        return {"booking_uid": booking_uid, "message_type": message_type, "sent": False}

    messaging = get_messaging_adapter()
    language = template_context.get("language", "en")

    result = messaging.send_message(
        channel="direct",
        recipient_id=booking_uid,
        body=body,
        language=language,
    )

    logger.info(
        "send_scheduled_message: booking=%s type=%s delivered=%s",
        booking_uid,
        message_type,
        result.delivered,
    )

    return {
        "booking_uid": booking_uid,
        "message_type": message_type,
        "sent": result.delivered,
        "external_id": result.external_id,
    }


def _check_and_mark_sent(booking_uid: str, message_type: str) -> bool:
    """Atomically check if message was sent and mark it if not.

    Returns True if the message was already sent (caller should skip).
    Returns False if it was not sent yet (now marked, caller should proceed).
    """
    try:
        from estades.delta.zope_context import plone_context

        import plone.api

        with plone_context() as (_app, portal):
            from zope.annotation.interfaces import IAnnotations

            brains = plone.api.content.find(UID=booking_uid)
            if not brains:
                return False

            booking = brains[0].getObject()
            annotations = IAnnotations(booking)
            sent = annotations.get("estades.delta.scheduled_messages", set())

            if message_type in sent:
                return True

            sent = set(sent)
            sent.add(message_type)
            annotations["estades.delta.scheduled_messages"] = sent
            return False

    except Exception:
        logger.exception("_check_and_mark_sent failed for %s/%s", booking_uid, message_type)
        return False


def _extract_kb(property_obj) -> dict:
    """Pull knowledge base fields from a Property for template rendering."""
    kb = {}
    for field_name in (
        "wifi_ssid", "wifi_password", "parking_instructions",
        "check_in_instructions", "check_out_instructions",
        "house_rules_kb", "local_recommendations", "emergency_contacts",
        "check_in_time", "check_out_time",
    ):
        val = getattr(property_obj, field_name, None)
        if val is not None:
            if hasattr(val, "raw"):
                val = val.raw
            kb[field_name] = val
    return kb


def _guest_name(booking) -> str:
    first = getattr(booking, "guest_first_name", "") or ""
    last = getattr(booking, "guest_last_name", "") or ""
    return f"{first} {last}".strip() or "Guest"
