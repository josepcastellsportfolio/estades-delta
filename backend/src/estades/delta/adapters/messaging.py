"""Messaging adapter — abstracts outbound message delivery.

Phase 1 ships only the StubMessagingAdapter (logs + no-ops).
Phase 3 adds WhatsAppBusinessAdapter and Beds24MessagingAdapter.
"""

from __future__ import annotations

import os

from dataclasses import dataclass
from estades.delta import logger
from typing import Protocol
from typing import runtime_checkable


@dataclass(frozen=True)
class DeliveryResult:
    external_id: str
    delivered: bool
    channel: str


@runtime_checkable
class IMessagingAdapter(Protocol):

    def send_message(
        self, channel: str, recipient_id: str, body: str, language: str = "en"
    ) -> DeliveryResult:
        """Deliver a message to a guest via the given channel."""
        ...


class StubMessagingAdapter:
    """Phase 1 stub — logs the send and returns success."""

    def send_message(
        self, channel: str, recipient_id: str, body: str, language: str = "en"
    ) -> DeliveryResult:
        logger.info(
            "StubMessaging.send channel=%s recipient=%s lang=%s body=%s",
            channel,
            recipient_id,
            language,
            body[:80],
        )
        return DeliveryResult(
            external_id=f"stub-msg-{channel}-001",
            delivered=True,
            channel=channel,
        )


def get_messaging_adapter() -> IMessagingAdapter:
    """Factory: returns the adapter named in MESSAGING_ADAPTER env."""
    adapter_name = os.environ.get("MESSAGING_ADAPTER", "stub")
    if adapter_name == "stub":
        return StubMessagingAdapter()
    logger.warning("Unknown MESSAGING_ADAPTER=%s, falling back to stub", adapter_name)
    return StubMessagingAdapter()
