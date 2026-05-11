"""Beds24 channel manager adapter — Phase 1 stub.

Phase 1 returns mock data; Phase 2 will hit Beds24 API v2 sandbox; Phase 3 swaps to
production credentials.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from datetime import timedelta
from estades.delta import logger
from typing import Protocol
from typing import runtime_checkable


@dataclass(frozen=True)
class AvailabilityWindow:
    """One contiguous block of availability for a property."""

    start: date
    end: date
    available: bool


@dataclass(frozen=True)
class Beds24BookingResult:
    """Result of pushing a booking into Beds24."""

    external_id: str
    confirmed: bool


@runtime_checkable
class IBeds24Adapter(Protocol):
    """Protocol implemented by all Beds24 adapters (stub, sandbox, prod)."""

    def sync_calendar(self, property_obj) -> list[AvailabilityWindow]:
        """Pull availability for a Property from Beds24. Stub: returns 60-day open window."""

    def create_booking(
        self, property_obj, check_in: date, check_out: date, guest_email: str
    ) -> Beds24BookingResult:
        """Block dates in Beds24 for a confirmed booking."""

    def update_availability(
        self, property_obj, start: date, end: date, available: bool
    ) -> None:
        """Push manual availability change to Beds24."""

    def handle_webhook(self, payload: dict) -> None:
        """Process an incoming Beds24 webhook (cancellation, OTA-originated booking, etc.)."""


class Beds24StubAdapter:
    """Phase 1 stub — logs calls and returns mock-but-coherent data."""

    def sync_calendar(self, property_obj) -> list[AvailabilityWindow]:
        logger.info("Beds24Stub.sync_calendar property=%s", getattr(property_obj, "id", "?"))
        today = date.today()
        return [
            AvailabilityWindow(start=today, end=today + timedelta(days=60), available=True)
        ]

    def create_booking(
        self, property_obj, check_in: date, check_out: date, guest_email: str
    ) -> Beds24BookingResult:
        logger.info(
            "Beds24Stub.create_booking property=%s check_in=%s check_out=%s guest=%s",
            getattr(property_obj, "id", "?"),
            check_in,
            check_out,
            guest_email,
        )
        return Beds24BookingResult(external_id="stub-booking-001", confirmed=True)

    def update_availability(
        self, property_obj, start: date, end: date, available: bool
    ) -> None:
        logger.info(
            "Beds24Stub.update_availability property=%s %s..%s available=%s",
            getattr(property_obj, "id", "?"),
            start,
            end,
            available,
        )

    def handle_webhook(self, payload: dict) -> None:
        event_type = payload.get("type", "<unknown>")
        external_id = payload.get("booking_id")
        logger.info(
            "Beds24Stub.handle_webhook type=%s external_id=%s payload_keys=%s",
            event_type,
            external_id,
            list(payload.keys()),
        )
