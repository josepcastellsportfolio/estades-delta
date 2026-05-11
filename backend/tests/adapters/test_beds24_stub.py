"""Tests for the Phase 1 Beds24 stub adapter (no network).

The real adapter implementation lands in Phase 2; until then we only assert that the
stub conforms to the protocol and returns the documented mock shape.
"""

from datetime import date
from estades.delta.adapters.beds24 import AvailabilityWindow
from estades.delta.adapters.beds24 import Beds24BookingResult
from estades.delta.adapters.beds24 import Beds24StubAdapter
from estades.delta.adapters.beds24 import IBeds24Adapter


class _FakeProperty:
    id = "casa-demo-riumar"


def test_stub_implements_protocol():
    assert isinstance(Beds24StubAdapter(), IBeds24Adapter)


def test_sync_calendar_returns_60_day_window():
    adapter = Beds24StubAdapter()
    windows = adapter.sync_calendar(_FakeProperty())
    assert len(windows) == 1
    win = windows[0]
    assert isinstance(win, AvailabilityWindow)
    assert win.available is True
    assert (win.end - win.start).days == 60


def test_create_booking_returns_external_id():
    adapter = Beds24StubAdapter()
    res = adapter.create_booking(
        _FakeProperty(), date(2026, 6, 1), date(2026, 6, 7), "g@example.com"
    )
    assert isinstance(res, Beds24BookingResult)
    assert res.confirmed is True
    assert res.external_id


def test_update_availability_is_noop():
    Beds24StubAdapter().update_availability(
        _FakeProperty(), date.today(), date.today(), False
    )


def test_handle_webhook_is_noop():
    Beds24StubAdapter().handle_webhook({
        "type": "booking.cancelled",
        "booking_id": "abc",
    })
