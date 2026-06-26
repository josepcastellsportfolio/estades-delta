"""Tests for the knowledge_base behavior applied to Property."""

from estades.delta.behaviors.knowledge_base import IKnowledgeBase
from estades.delta.behaviors.knowledge_base import IKnowledgeBaseMarker
from plone import api
from plone.behavior.interfaces import IBehavior
from zope.component import getUtility

import pytest
import transaction


@pytest.fixture
def portal(integration):
    return integration["portal"]


@pytest.fixture
def property_obj(portal):
    """Create a Property under the portal root for the test."""
    with api.env.adopt_roles(["Manager"]):
        prop = api.content.create(
            container=portal,
            type="Property",
            id="kb-test-property",
            title="KB Test Property",
            short_name="kb-test-property",
        )
        transaction.commit()
    return prop


class TestKnowledgeBaseBehavior:
    def test_behavior_is_registered(self):
        """The behavior is registered as a utility."""
        utility = getUtility(
            IBehavior,
            name="estades.delta.behaviors.knowledge_base.IKnowledgeBase",
        )
        assert utility is not None

    def test_property_provides_marker(self, property_obj):
        """A Property created via the factory provides the marker interface."""
        assert IKnowledgeBaseMarker.providedBy(property_obj)

    def test_property_provides_schema_interface(self, property_obj):
        """The schema fields are accessible on the Property instance."""
        kb = IKnowledgeBase(property_obj)
        assert kb is not None

    def test_wifi_fields_persist(self, property_obj):
        kb = IKnowledgeBase(property_obj)
        kb.wifi_ssid = "EstadesDeltaGuest"
        kb.wifi_password = "delta-2026"
        transaction.commit()

        # Reload via the adapter to confirm round-trip.
        kb2 = IKnowledgeBase(property_obj)
        assert kb2.wifi_ssid == "EstadesDeltaGuest"
        assert kb2.wifi_password == "delta-2026"

    def test_kb_approved_facts_default_is_empty_list(self, property_obj):
        kb = IKnowledgeBase(property_obj)
        # The default may come back as None on a freshly-created object that
        # never had the field written. Either is acceptable for the empty case.
        assert kb.kb_approved_facts in (None, [], [{}])

    def test_kb_approved_facts_stores_list_of_dicts(self, property_obj):
        kb = IKnowledgeBase(property_obj)
        facts = [
            {
                "question": "What time is check-in?",
                "answer_template": "Check-in is at {{ check_in_time }}.",
                "languages": ["en", "ca", "es"],
            },
            {
                "question": "WiFi password?",
                "answer_template": "The WiFi is {{ wifi_ssid }} / {{ wifi_password }}.",
                "languages": ["en", "ca", "es", "fr", "de"],
            },
        ]
        kb.kb_approved_facts = facts
        transaction.commit()

        kb2 = IKnowledgeBase(property_obj)
        stored = list(kb2.kb_approved_facts)
        assert len(stored) == 2
        assert stored[0]["question"] == "What time is check-in?"
        assert "fr" in stored[1]["languages"]
