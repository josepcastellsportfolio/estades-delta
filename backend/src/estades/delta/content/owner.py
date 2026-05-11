"""Owner content type: a property owner (individual or company)."""
from datetime import date
from estades.delta import _
from plone.dexterity.content import Container
from plone.supermodel import model
from zope import schema
from zope.interface import implementer


class IOwner(model.Schema):
    """Dexterity schema for the Owner content type.

    Children: the Properties this owner runs (so the Owner acts as a folder).
    """

    # --- Legal identity ---
    legal_name = schema.TextLine(
        title=_("Legal name"),
        required=True,
    )
    legal_id = schema.TextLine(
        title=_("Legal ID (NIF/NIE/CIF)"),
        required=False,
    )
    legal_id_type = schema.Choice(
        title=_("Legal ID type"),
        vocabulary="estades.delta.vocabularies.LegalIdTypes",
        required=False,
    )

    # --- Contact / fiscal address ---
    address = schema.TextLine(
        title=_("Address"),
        required=False,
    )
    postal_code = schema.TextLine(
        title=_("Postal code"),
        required=False,
    )
    city = schema.TextLine(
        title=_("City"),
        required=False,
    )
    country = schema.TextLine(
        title=_("Country"),
        required=False,
        default="ES",
    )

    email = schema.TextLine(
        title=_("Email"),
        required=True,
    )
    phone = schema.TextLine(
        title=_("Phone"),
        required=False,
    )
    iban = schema.TextLine(
        title=_("IBAN"),
        required=False,
    )

    # --- Stripe Connect ---
    stripe_connect_id = schema.TextLine(
        title=_("Stripe Connect account ID"),
        required=False,
    )
    stripe_connect_status = schema.Choice(
        title=_("Stripe Connect status"),
        vocabulary="estades.delta.vocabularies.StripeConnectStatuses",
        required=False,
        default="pending",
    )

    # --- Catalan HUT (Habitatge d'Us Turistic) ---
    has_hut = schema.Bool(
        title=_("Has HUT registration"),
        required=False,
        default=False,
    )
    hut_number = schema.TextLine(
        title=_("HUT number"),
        required=False,
    )

    # --- Preferences ---
    preferred_language = schema.Choice(
        title=_("Preferred language"),
        vocabulary="estades.delta.vocabularies.PreferredLanguages",
        required=False,
        default="ca",
    )

    # --- Contract ---
    contract_signed_date = schema.Date(
        title=_("Contract signed date"),
        required=False,
    )
    contract_revision = schema.TextLine(
        title=_("Contract revision"),
        description=_("Document revision id (e.g. v2-2026-01)."),
        required=False,
    )

    # --- Commission rates ---
    commission_rate_microsite = schema.Float(
        title=_("Commission rate (microsite, fraction)"),
        description=_("Default 0.06 = 6%."),
        required=False,
        default=0.06,
    )
    commission_rate_marketplace = schema.Float(
        title=_("Commission rate (marketplace, fraction)"),
        description=_("Default 0.10 = 10%."),
        required=False,
        default=0.10,
    )

    # --- Chatbot (reserved) ---
    chatbot_enabled = schema.Bool(
        title=_("Chatbot enabled"),
        default=False,
    )
    chatbot_tier = schema.Choice(
        title=_("Chatbot tier"),
        vocabulary="estades.delta.vocabularies.ChatbotTiers",
        required=False,
    )
    chatbot_custom_prompt = schema.Text(
        title=_("Chatbot custom system prompt"),
        required=False,
    )


@implementer(IOwner)
class Owner(Container):
    """Owner content type."""
