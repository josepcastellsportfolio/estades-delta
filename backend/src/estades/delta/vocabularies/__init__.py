"""Vocabularies for estades.delta content schemas."""
from estades.delta import _
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


def _vocabulary(terms: list[tuple[str, str]]) -> SimpleVocabulary:
    return SimpleVocabulary(
        [SimpleTerm(value=value, token=value, title=_(title)) for value, title in terms]
    )


@provider(IVocabularyFactory)
def chatbot_tiers(_context):
    return _vocabulary(
        [
            ("", "(none)"),
            ("S", "Tier S - FAQ"),
            ("M", "Tier M - transactional"),
            ("L", "Tier L - full concierge"),
        ]
    )


@provider(IVocabularyFactory)
def payment_statuses(_context):
    return _vocabulary(
        [
            ("pending", "Pending"),
            ("paid", "Paid"),
            ("refunded", "Refunded"),
            ("failed", "Failed"),
        ]
    )


@provider(IVocabularyFactory)
def booking_sources(_context):
    return _vocabulary(
        [
            ("direct_microsite", "Direct - microsite"),
            ("direct_marketplace", "Direct - marketplace"),
            ("booking_com", "Booking.com"),
            ("airbnb", "Airbnb"),
            ("manual", "Manual"),
        ]
    )


@provider(IVocabularyFactory)
def stripe_connect_statuses(_context):
    return _vocabulary(
        [
            ("pending", "Pending"),
            ("active", "Active"),
            ("restricted", "Restricted"),
        ]
    )


@provider(IVocabularyFactory)
def legal_id_types(_context):
    return _vocabulary(
        [
            ("nif", "NIF"),
            ("nie", "NIE"),
            ("cif", "CIF"),
            ("passport", "Passport"),
        ]
    )


@provider(IVocabularyFactory)
def preferred_languages(_context):
    return _vocabulary(
        [
            ("ca", "Catala"),
            ("es", "Espanol"),
            ("en", "English"),
            ("fr", "Francais"),
            ("de", "Deutsch"),
        ]
    )
