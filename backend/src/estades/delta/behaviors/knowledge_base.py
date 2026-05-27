"""Knowledge Base behavior — owner-curated facts the messaging IA can rely on.

Applied to Property via profiles/default/types/Property.xml. The text fields
are multilingual-aware (i18n via plone.app.multilingual on the Property).

`kb_approved_facts` is the structured part: a list of {question,
answer_template, languages} dicts that the conversation pipeline uses to decide
whether the LLM is allowed to respond autonomously. If a guest message matches
an approved fact AND the model returns high confidence on the classification,
the pipeline can send the response without owner approval.
"""

import json

from estades.delta import _
from plone.app.textfield import RichText
from plone.autoform.interfaces import IFormFieldProvider
from plone.schema import JSONField
from plone.supermodel import model
from zope import schema
from zope.interface import Interface
from zope.interface import provider


# JSON schema (as a JSON-encoded string — plone.schema.JSONField expects str).
# We keep it permissive: the editorial UI in Volto enforces the shape, the
# backend validates that it's a list and that each element is an object —
# anything more strict would slow iteration while owners and translators
# experiment with the format.
KB_APPROVED_FACTS_SCHEMA = json.dumps({
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "answer_template": {"type": "string"},
            "languages": {
                "type": "array",
                "items": {"type": "string"},
            },
        },
        "required": ["question", "answer_template"],
    },
})


class IKnowledgeBaseMarker(Interface):
    """Marker interface added to objects providing the KnowledgeBase behavior."""


@provider(IFormFieldProvider)
class IKnowledgeBase(model.Schema):
    """Knowledge base fields for properties.

    All multilingual text fields are translatable via plone.app.multilingual
    on the parent Property (no extra config needed here).
    """

    model.fieldset(
        "knowledge_base",
        label=_("Knowledge base"),
        fields=[
            "wifi_ssid",
            "wifi_password",
            "parking_instructions",
            "check_in_instructions",
            "check_out_instructions",
            "house_rules_kb",
            "local_recommendations",
            "emergency_contacts",
            "kb_approved_facts",
        ],
    )

    wifi_ssid = schema.TextLine(
        title=_("WiFi SSID"),
        description=_("Network name shown to guests."),
        required=False,
    )

    wifi_password = schema.TextLine(
        title=_("WiFi password"),
        description=_("Stored in the clear — this is a guest-facing credential, not a secret."),
        required=False,
    )

    parking_instructions = RichText(
        title=_("Parking instructions"),
        description=_("Where to park, restrictions, paid options nearby."),
        required=False,
    )

    check_in_instructions = RichText(
        title=_("Check-in instructions"),
        description=_("How to get the keys, lockbox code, door access, etc."),
        required=False,
    )

    check_out_instructions = RichText(
        title=_("Check-out instructions"),
        description=_("What guests should do before leaving (rubbish, keys, etc.)."),
        required=False,
    )

    house_rules_kb = RichText(
        title=_("House rules (knowledge base)"),
        description=_(
            "Rules the IA may quote when guests ask. Plain prose, not legalese. "
            "Distinct from the contractual `house_rules` on Property."
        ),
        required=False,
    )

    local_recommendations = RichText(
        title=_("Local recommendations"),
        description=_(
            "Restaurants, walks, bike rentals around the Delta. The IA quotes from this when asked."
        ),
        required=False,
    )

    emergency_contacts = RichText(
        title=_("Emergency contacts"),
        description=_("24/7 numbers: owner, medical, plumber, locksmith."),
        required=False,
    )

    kb_approved_facts = JSONField(
        title=_("Approved facts (FAQ)"),
        description=_(
            "Owner-approved Q&A entries the IA can quote autonomously. Each entry: "
            "{question, answer_template, languages}. Use {{ var }} placeholders for "
            "Property-level fields (e.g. `{{ check_in_time }}`)."
        ),
        required=False,
        schema=KB_APPROVED_FACTS_SCHEMA,
        default=[],
    )


class KnowledgeBase:
    """Behavior adapter — no extra logic; fields are stored as annotations.

    Plone Dexterity uses the schema declaration above to add the fields to the
    object's attributes via the form machinery. Keeping the adapter class
    empty is intentional: domain logic belongs in services/, not in behaviors.
    """

    def __init__(self, context):
        self.context = context
