"""Property content type: a single chalet / casa rural / apartament turistic."""

from estades.delta import _
from plone.app.textfield import RichText
from plone.dexterity.content import Container
from plone.supermodel import model
from zope import schema
from zope.interface import implementer


class IProperty(model.Schema):
    """Dexterity schema for the Property content type.

    Children: photos, custom blocks, additional pages. Acts as the canonical
    record for one rental unit; microsites are rendered by Volto from the same
    Property under a tenant-specific hostname (see CLAUDE.md section 5.1).
    """

    # --- Identity / SEO ---
    short_name = schema.TextLine(
        title=_("Short name (URL slug)"),
        description=_(
            "Used for canonical URLs and the *.estadesdelta.local subdomain."
        ),
        required=True,
    )

    subtitle = schema.TextLine(
        title=_("Subtitle"),
        required=False,
    )

    # --- Relationships ---
    owner_ref = schema.Choice(
        title=_("Owner"),
        description=_("The Owner who legally lets this property."),
        vocabulary="plone.app.vocabularies.Catalog",
        required=False,
    )

    # --- Location ---
    municipality = schema.TextLine(
        title=_("Municipality"),
        required=False,
    )
    zone = schema.TextLine(
        title=_("Zone / area"),
        description=_("E.g. Riumar, Poblenou del Delta, l'Ampolla."),
        required=False,
    )
    address = schema.TextLine(
        title=_("Address"),
        required=False,
    )
    latitude = schema.Float(
        title=_("Latitude"),
        required=False,
    )
    longitude = schema.Float(
        title=_("Longitude"),
        required=False,
    )

    # --- Capacity ---
    max_guests = schema.Int(
        title=_("Max guests"),
        required=True,
        default=4,
    )
    bedrooms = schema.Int(
        title=_("Bedrooms"),
        required=True,
        default=2,
    )
    bathrooms = schema.Int(
        title=_("Bathrooms"),
        required=False,
        default=1,
    )
    beds_double = schema.Int(
        title=_("Double beds"),
        required=False,
        default=0,
    )
    beds_single = schema.Int(
        title=_("Single beds"),
        required=False,
        default=0,
    )

    # --- Amenities (free-form list for now; converted to vocabulary in Day 2) ---
    amenities = schema.List(
        title=_("Amenities"),
        value_type=schema.TextLine(),
        required=False,
        default=[],
    )

    # --- Pricing ---
    base_price_low_season = schema.Float(
        title=_("Base price (low season, EUR/night)"),
        required=False,
    )
    base_price_mid_season = schema.Float(
        title=_("Base price (mid season, EUR/night)"),
        required=False,
    )
    base_price_high_season = schema.Float(
        title=_("Base price (high season, EUR/night)"),
        required=False,
    )
    cleaning_fee = schema.Float(
        title=_("Cleaning fee (EUR, one-time)"),
        required=False,
        default=0.0,
    )
    tourist_tax_per_night = schema.Float(
        title=_("Tourist tax (EUR / night / adult)"),
        required=False,
        default=1.10,
    )
    minimum_stay_low = schema.Int(
        title=_("Minimum stay (low season, nights)"),
        required=False,
        default=2,
    )
    minimum_stay_high = schema.Int(
        title=_("Minimum stay (high season, nights)"),
        required=False,
        default=4,
    )

    # --- Logistics ---
    check_in_time = schema.TextLine(
        title=_("Check-in time"),
        required=False,
        default="16:00",
    )
    check_out_time = schema.TextLine(
        title=_("Check-out time"),
        required=False,
        default="11:00",
    )

    # --- Multi-tenant / external integrations ---
    beds24_property_id = schema.TextLine(
        title=_("Beds24 property ID"),
        description=_("External identifier in Beds24; populated after onboarding."),
        required=False,
    )
    custom_domain = schema.TextLine(
        title=_("Custom domain"),
        description=_(
            "Optional fully-qualified domain for this microsite (e.g. casariumar.cat)."
        ),
        required=False,
    )

    # --- Long-form copy (rich; multilingual overrides via plone.app.multilingual) ---
    long_description = RichText(
        title=_("Long description"),
        required=False,
    )
    house_rules = RichText(
        title=_("House rules"),
        required=False,
    )

    # --- Chatbot (reserved fields — wired in Month 2+ via the assistant service) ---
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


@implementer(IProperty)
class Property(Container):
    """Property content type."""
