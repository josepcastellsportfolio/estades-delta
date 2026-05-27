"""Tests for scheduled messaging tasks (Phase 1 stubs)."""

from estades.delta.tasks.scheduled import scan_upcoming_checkins
from estades.delta.tasks.scheduled import send_scheduled_message


def test_scan_upcoming_checkins_stub():
    result = scan_upcoming_checkins()
    assert result["scanned"] == 0
    assert result["enqueued"] == 0


def test_send_scheduled_message_stub():
    result = send_scheduled_message(
        booking_uid="test-booking-001",
        message_type="welcome",
        template_context={"guest_name": "Joan"},
    )
    assert result["sent"] is False
    assert result["message_type"] == "welcome"
