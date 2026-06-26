"""Tests for GuestConversation / GuestMessage content types + workflow."""

from datetime import date
from plone import api

import pytest
import transaction


@pytest.fixture
def portal(integration):
    return integration["portal"]


@pytest.fixture
def property_obj(portal):
    with api.env.adopt_roles(["Manager"]):
        prop = api.content.create(
            container=portal,
            type="Property",
            id="gc-test-property",
            title="GC Test Property",
            short_name="gc-test-property",
        )
        transaction.commit()
    return prop


@pytest.fixture
def booking(portal, property_obj):
    with api.env.adopt_roles(["Manager"]):
        bk = api.content.create(
            container=portal,
            type="Booking",
            id="gc-test-booking",
            title="GC Test Booking",
            property_ref=property_obj.UID(),
            guest_first_name="Ada",
            guest_last_name="Lovelace",
            guest_email="ada@example.com",
            check_in_date=date(2026, 7, 1),
            check_out_date=date(2026, 7, 8),
        )
        transaction.commit()
    return bk


class TestGuestConversation:
    def test_create_under_booking(self, booking):
        """GuestConversation is creatable under a Booking (now folderish)."""
        with api.env.adopt_roles(["Manager"]):
            conv = api.content.create(
                container=booking,
                type="GuestConversation",
                id="conv-1",
                title="WhatsApp - Ada Lovelace",
                channel="whatsapp",
                mode="assisted",
            )
            transaction.commit()
        assert conv.portal_type == "GuestConversation"
        assert conv.channel == "whatsapp"
        assert conv.mode == "assisted"

    def test_default_mode_is_assisted(self, booking):
        with api.env.adopt_roles(["Manager"]):
            conv = api.content.create(
                container=booking,
                type="GuestConversation",
                id="conv-default",
                title="Default conversation",
                channel="direct",
            )
        assert conv.mode == "assisted"

    def test_initial_workflow_state_is_open(self, booking):
        with api.env.adopt_roles(["Manager"]):
            conv = api.content.create(
                container=booking,
                type="GuestConversation",
                id="conv-wf",
                title="WF conv",
                channel="direct",
            )
            transaction.commit()
        state = api.content.get_state(obj=conv)
        assert state == "open"

    def test_escalate_transition_moves_to_waiting_owner(self, booking):
        with api.env.adopt_roles(["Manager"]):
            conv = api.content.create(
                container=booking,
                type="GuestConversation",
                id="conv-esc",
                title="Esc conv",
                channel="direct",
            )
            api.content.transition(obj=conv, transition="escalate")
            transaction.commit()
        assert api.content.get_state(obj=conv) == "waiting_owner"


class TestGuestMessage:
    def test_create_under_conversation(self, booking):
        with api.env.adopt_roles(["Manager"]):
            conv = api.content.create(
                container=booking,
                type="GuestConversation",
                id="conv-msg",
                title="Msg conv",
                channel="direct",
            )
            msg = api.content.create(
                container=conv,
                type="GuestMessage",
                id="msg-1",
                title="msg-1",
                direction="inbound",
                body="A quina hora es el check-in?",
                language_detected="ca",
                classification="faq",
                classification_confidence=0.92,
            )
            transaction.commit()
        assert msg.direction == "inbound"
        assert msg.classification == "faq"
        assert abs(msg.classification_confidence - 0.92) < 1e-6

    def test_ia_sent_defaults_false(self, booking):
        with api.env.adopt_roles(["Manager"]):
            conv = api.content.create(
                container=booking,
                type="GuestConversation",
                id="conv-iasent",
                title="ia sent conv",
                channel="direct",
            )
            msg = api.content.create(
                container=conv,
                type="GuestMessage",
                id="m-ia",
                title="m-ia",
                direction="outbound",
                body="Reply",
            )
        assert msg.ia_sent is False


class TestBookingActualCheckinTime:
    def test_actual_checkin_time_persists(self, booking):
        from datetime import datetime
        booking.actual_checkin_time = datetime(2026, 7, 1, 16, 30)
        transaction.commit()
        assert booking.actual_checkin_time == datetime(2026, 7, 1, 16, 30)
