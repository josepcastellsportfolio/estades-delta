"""Stripe Connect Express adapter — Phase 1 stub.

Owners onboard via Stripe Connect Express; payments are destination charges with
our commission taken as ``application_fee_amount``. See CLAUDE.md section 10.
"""
from __future__ import annotations

from dataclasses import dataclass
from estades.delta import logger
from typing import Protocol


@dataclass(frozen=True)
class StripeConnectOnboarding:
    """Result of creating a Stripe Connect Express account for an Owner."""

    account_id: str
    onboarding_url: str


@dataclass(frozen=True)
class StripePaymentIntentResult:
    """Result of creating a PaymentIntent for a Booking."""

    payment_intent_id: str
    client_secret: str
    amount_cents: int
    application_fee_cents: int


@dataclass(frozen=True)
class CommissionBreakdown:
    """Commission computed for a Booking.

    Owner payout is rounded to cents at PaymentIntent time; here we keep EUR floats
    for clarity.
    """

    rate: float
    commission_amount: float
    owner_payout: float


class IStripeAdapter(Protocol):
    """Protocol implemented by all Stripe adapters (stub, sandbox, prod)."""

    def create_connected_account(self, owner_obj) -> StripeConnectOnboarding:
        """Create a Stripe Express account for an Owner; return onboarding link."""

    def create_payment_intent(self, booking_obj) -> StripePaymentIntentResult:
        """Create a PaymentIntent (destination charge) for a Booking."""

    def compute_commission(self, booking_obj) -> CommissionBreakdown:
        """Compute our commission for a Booking based on its source."""

    def handle_webhook(self, payload: dict, signature: str) -> None:
        """Verify Stripe webhook signature, then dispatch to the right handler."""


class StripeStubAdapter:
    """Phase 1 stub — logs calls and returns deterministic mock identifiers."""

    def create_connected_account(self, owner_obj) -> StripeConnectOnboarding:
        owner_id = getattr(owner_obj, "id", "?")
        logger.info("StripeStub.create_connected_account owner=%s", owner_id)
        return StripeConnectOnboarding(
            account_id=f"acct_stub_{owner_id}",
            onboarding_url=f"https://connect.stripe.test/onboard/{owner_id}",
        )

    def create_payment_intent(self, booking_obj) -> StripePaymentIntentResult:
        total = float(getattr(booking_obj, "total_amount", 0.0) or 0.0)
        commission = float(getattr(booking_obj, "our_commission_amount", 0.0) or 0.0)
        amount_cents = int(round(total * 100))
        fee_cents = int(round(commission * 100))
        booking_id = getattr(booking_obj, "id", "?")
        logger.info(
            "StripeStub.create_payment_intent booking=%s total=%.2f commission=%.2f",
            booking_id,
            total,
            commission,
        )
        return StripePaymentIntentResult(
            payment_intent_id=f"pi_stub_{booking_id}",
            client_secret=f"pi_stub_{booking_id}_secret",
            amount_cents=amount_cents,
            application_fee_cents=fee_cents,
        )

    def compute_commission(self, booking_obj) -> CommissionBreakdown:
        source = getattr(booking_obj, "source", "direct_microsite")
        total = float(getattr(booking_obj, "total_amount", 0.0) or 0.0)
        rate = 0.06 if source == "direct_microsite" else 0.10
        commission = round(total * rate, 2)
        payout = round(total - commission, 2)
        logger.info(
            "StripeStub.compute_commission source=%s total=%.2f rate=%.2f",
            source,
            total,
            rate,
        )
        return CommissionBreakdown(rate=rate, commission_amount=commission, owner_payout=payout)

    def handle_webhook(self, payload: dict, signature: str) -> None:
        event_type = payload.get("type", "<unknown>")
        logger.info(
            "StripeStub.handle_webhook type=%s signature_present=%s",
            event_type,
            bool(signature),
        )
