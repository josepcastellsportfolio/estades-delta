"""Booking content type: a single reservation tied to a Property."""
from estades.delta import _
from plone.app.relationfield.behavior import IRelatedItems
from plone.autoform import directives
from plone.dexterity.content import Item
from plone.supermodel import model
from z3c.relationfield.schema import RelationChoice
from zope import schema
from zope.interface import implementer


class IBooking(model.Schema):
    """Dexterity schema for the Booking content type (Item, not Container).

    Bookings are leaves; they sit somewhere in the Plone tree (typically under a
    `bookings/` folder or under the Property they belong to) and never hold children.
    """

    # --- Relationship to the Property ---
    property_ref = RelationChoice(
        title=_("Property"),
        description=_("The Property this booking is for."),
        vocabulary="plone.app.vocabularies.Catalog",
        required=True,
    )
    directives.widget("property_ref", pattern_options={"selectableTypes": ["Property"]})

    # --- Guest data ---
    guest_first_name = schema.TextLine(
        title=_("Guest first name"),
        required=True,
    )
    guest_last_name = schema.TextLine(
        title=_("Guest last name"),
        required=True,
    )
    guest_email = schema.TextLine(
        title=_("Guest email"),
        required=True,
    )
    guest_phone = schema.TextLine(
        title=_("Guest phone"),
        required=False,
    )
    guest_country = schema.TextLine(
        title=_("Guest country"),
        required=False,
    )
    guest_count_adults = schema.Int(
        title=_("Adults"),
        required=True,
        default=2,
    )
    guest_count_children = schema.Int(
        title=_("Children"),
        required=False,
        default=0,
    )
    guest_count_infants = schema.Int(
        title=_("Infants"),
        required=False,
        default=0,
    )

    # --- Dates ---
    check_in_date = schema.Date(
        title=_("Check-in date"),
        required=True,
    )
    check_out_date = schema.Date(
        title=_("Check-out date"),
        required=True,
    )
    # nights is computed via an indexer; not stored as a writable field.

    # --- Money (in EUR, full precision; rounding to cents happens at PaymentIntent time) ---
    subtotal = schema.Float(
        title=_("Subtotal"),
        required=False,
        default=0.0,
    )
    cleaning_fee = schema.Float(
        title=_("Cleaning fee"),
        required=False,
        default=0.0,
    )
    tourist_tax_total = schema.Float(
        title=_("Tourist tax total"),
        required=False,
        default=0.0,
    )
    total_amount = schema.Float(
        title=_("Total amount"),
        required=False,
        default=0.0,
    )

    # --- Commission split ---
    our_commission_rate = schema.Float(
        title=_("Our commission rate"),
        description=_("0.06 for microsite, 0.10 for marketplace."),
        required=False,
    )
    our_commission_amount = schema.Float(
        title=_("Our commission amount"),
        required=False,
    )
    owner_payout_amount = schema.Float(
        title=_("Owner payout amount"),
        required=False,
    )

    # --- Stripe ---
    payment_intent_id = schema.TextLine(
        title=_("Stripe PaymentIntent ID"),
        required=False,
    )
    payment_status = schema.Choice(
        title=_("Payment status"),
        vocabulary="estades.delta.vocabularies.PaymentStatuses",
        required=False,
        default="pending",
    )

    # --- Source attribution ---
    source = schema.Choice(
        title=_("Source"),
        vocabulary="estades.delta.vocabularies.BookingSources",
        required=False,
        default="direct_microsite",
    )

    # --- External (Beds24 etc.) ---
    booking_external_id = schema.TextLine(
        title=_("External booking ID"),
        description=_("Used for idempotency when receiving Beds24 / Booking.com webhooks."),
        required=False,
    )


@implementer(IBooking)
class Booking(Item):
    """Booking content type."""
