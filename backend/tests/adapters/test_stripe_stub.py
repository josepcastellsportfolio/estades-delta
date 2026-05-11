"""Tests for the Phase 1 Stripe Connect stub adapter (no network)."""

from estades.delta.adapters.stripe_connect import CommissionBreakdown
from estades.delta.adapters.stripe_connect import IStripeAdapter
from estades.delta.adapters.stripe_connect import StripeConnectOnboarding
from estades.delta.adapters.stripe_connect import StripePaymentIntentResult
from estades.delta.adapters.stripe_connect import StripeStubAdapter


class _FakeOwner:
    id = "owner-josep"


class _FakeBooking:
    id = "booking-001"
    total_amount = 500.0
    our_commission_amount = 30.0
    source = "direct_microsite"


class _FakeMarketplaceBooking:
    id = "booking-002"
    total_amount = 500.0
    our_commission_amount = 50.0
    source = "direct_marketplace"


def test_stub_implements_protocol():
    assert isinstance(StripeStubAdapter(), IStripeAdapter)


def test_create_connected_account_returns_onboarding():
    res = StripeStubAdapter().create_connected_account(_FakeOwner())
    assert isinstance(res, StripeConnectOnboarding)
    assert res.account_id.startswith("acct_stub_")
    assert "owner-josep" in res.account_id


def test_create_payment_intent_returns_amount_cents():
    res = StripeStubAdapter().create_payment_intent(_FakeBooking())
    assert isinstance(res, StripePaymentIntentResult)
    assert res.amount_cents == 50000
    assert res.application_fee_cents == 3000


def test_compute_commission_microsite_is_6_percent():
    res = StripeStubAdapter().compute_commission(_FakeBooking())
    assert isinstance(res, CommissionBreakdown)
    assert res.rate == 0.06
    assert res.commission_amount == 30.0
    assert res.owner_payout == 470.0


def test_compute_commission_marketplace_is_10_percent():
    res = StripeStubAdapter().compute_commission(_FakeMarketplaceBooking())
    assert res.rate == 0.10
    assert res.commission_amount == 50.0
    assert res.owner_payout == 450.0


def test_handle_webhook_is_noop():
    StripeStubAdapter().handle_webhook({"type": "payment_intent.succeeded"}, "sig_test")
