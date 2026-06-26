"""Tests for the Phase 1 messaging stub adapter."""

from estades.delta.adapters.messaging import DeliveryResult
from estades.delta.adapters.messaging import IMessagingAdapter
from estades.delta.adapters.messaging import StubMessagingAdapter


def test_stub_implements_protocol():
    assert isinstance(StubMessagingAdapter(), IMessagingAdapter)


def test_stub_send_returns_delivery_result():
    adapter = StubMessagingAdapter()
    result = adapter.send_message(
        channel="whatsapp",
        recipient_id="guest-123",
        body="Hello from the property!",
        language="en",
    )
    assert isinstance(result, DeliveryResult)
    assert result.delivered is True
    assert result.channel == "whatsapp"
    assert result.external_id
