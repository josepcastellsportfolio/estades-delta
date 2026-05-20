"""Vocabularies for estades.delta content schemas."""

from estades.delta import _
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


def _vocabulary(terms: list[tuple[str, str]]) -> SimpleVocabulary:
    return SimpleVocabulary([
        SimpleTerm(value=value, token=value, title=_(title)) for value, title in terms
    ])


@provider(IVocabularyFactory)
def chatbot_tiers(_context):
    return _vocabulary([
        ("", "(none)"),
        ("S", "Tier S - FAQ"),
        ("M", "Tier M - transactional"),
        ("L", "Tier L - full concierge"),
    ])


@provider(IVocabularyFactory)
def payment_statuses(_context):
    return _vocabulary([
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("refunded", "Refunded"),
        ("failed", "Failed"),
    ])


@provider(IVocabularyFactory)
def booking_sources(_context):
    return _vocabulary([
        ("direct_microsite", "Direct - microsite"),
        ("direct_marketplace", "Direct - marketplace"),
        ("booking_com", "Booking.com"),
        ("airbnb", "Airbnb"),
        ("manual", "Manual"),
    ])


@provider(IVocabularyFactory)
def stripe_connect_statuses(_context):
    return _vocabulary([
        ("pending", "Pending"),
        ("active", "Active"),
        ("restricted", "Restricted"),
    ])


@provider(IVocabularyFactory)
def legal_id_types(_context):
    return _vocabulary([
        ("nif", "NIF"),
        ("nie", "NIE"),
        ("cif", "CIF"),
        ("passport", "Passport"),
    ])


@provider(IVocabularyFactory)
def preferred_languages(_context):
    return _vocabulary([
        ("ca", "Catala"),
        ("es", "Espanol"),
        ("en", "English"),
        ("fr", "Francais"),
        ("de", "Deutsch"),
    ])


@provider(IVocabularyFactory)
def message_channels(_context):
    """Where a guest message arrived from."""
    return _vocabulary([
        ("whatsapp", "WhatsApp"),
        ("airbnb", "Airbnb"),
        ("booking", "Booking.com"),
        ("direct", "Direct (microsite/marketplace)"),
    ])


@provider(IVocabularyFactory)
def conversation_modes(_context):
    """How autonomously the IA can act on this conversation."""
    return _vocabulary([
        ("manual", "Manual - only suggestions stored, no alerts"),
        ("assisted", "Assisted - IA suggests, owner approves"),
        ("autonomous", "Autonomous - IA replies directly on approved FAQs"),
    ])


@provider(IVocabularyFactory)
def conversation_states(_context):
    """State variable for guest_conversation_workflow."""
    return _vocabulary([
        ("open", "Open"),
        ("waiting_owner", "Waiting for owner"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ])


@provider(IVocabularyFactory)
def message_classifications(_context):
    """Output of the LLM classifier on an inbound message."""
    return _vocabulary([
        ("faq", "FAQ"),
        ("urgent", "Urgent"),
        ("team_query", "Team query"),
        ("other", "Other"),
        ("unclassified", "Unclassified (LLM failed)"),
    ])


@provider(IVocabularyFactory)
def message_directions(_context):
    return _vocabulary([
        ("inbound", "Inbound (from guest)"),
        ("outbound", "Outbound (to guest)"),
    ])


@provider(IVocabularyFactory)
def palettes(_context):
    """Three boutique visual palettes the property owner can pick from.

    Tokens IDs match the [data-palette="…"] selectors used in the Volto addon
    `theme/palettes.scss`. Keep these strings in sync with PALETTES in
    frontend/packages/volto-estades-delta/src/theme/tokens.ts.
    """
    return _vocabulary([
        ("arrossar", "Arrossar (rural green)"),
        ("riu-i-mar", "Riu i Mar (boutique navy)"),
        ("capvespre", "Capvespre (sunset ocre)"),
    ])
