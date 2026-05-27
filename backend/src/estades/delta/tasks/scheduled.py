"""Scheduled messaging tasks — driven by Celery beat.

These tasks scan for upcoming check-ins and enqueue welcome/pre-checkin
messages at the right time. They don't touch the LLM — they use Jinja2
templates rendered against the Property's knowledge base fields.
"""

from __future__ import annotations

from estades.delta import logger
from estades.delta.celery_app import app


@app.task(name="estades.delta.tasks.scheduled.scan_upcoming_checkins")
def scan_upcoming_checkins() -> dict:
    """Scan confirmed bookings with check-in in the next 48h.

    For each booking that hasn't had a pre-checkin message sent yet,
    enqueue a `send_scheduled_message` task.

    Phase 1: logs the scan and returns stats. Real Plone queries come
    when we wire the Zope-aware context helper.
    """
    logger.info("scan_upcoming_checkins: scanning (Phase 1 stub)")
    return {"scanned": 0, "enqueued": 0}


@app.task(name="estades.delta.tasks.scheduled.send_scheduled_message")
def send_scheduled_message(
    booking_uid: str, message_type: str, template_context: dict
) -> dict:
    """Render and send a scheduled message (welcome, pre_checkin, post_checkin).

    Args:
        booking_uid: UID of the Booking content object.
        message_type: One of 'welcome', 'pre_checkin', 'post_checkin'.
        template_context: Dict with Property KB fields + booking details for
            Jinja2 template rendering.
    """
    logger.info(
        "send_scheduled_message: booking=%s type=%s (Phase 1 stub)",
        booking_uid,
        message_type,
    )
    return {"booking_uid": booking_uid, "message_type": message_type, "sent": False}
