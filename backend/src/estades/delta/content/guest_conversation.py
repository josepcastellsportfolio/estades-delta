"""GuestConversation content type — one ongoing thread with a single guest.

A GuestConversation lives directly under a Booking (the Booking is folderish
since M1; see ADR-017). Children are GuestMessage items (inbound + outbound).
The state attribute drives `guest_conversation_workflow`:
    open -> waiting_owner -> resolved -> closed
"""

from estades.delta import _
from plone.dexterity.content import Container
from plone.supermodel import model
from zope import schema
from zope.interface import implementer


class IGuestConversation(model.Schema):
    """Dexterity schema for the GuestConversation content type."""

    guest_external_id = schema.TextLine(
        title=_("Guest external ID"),
        description=_(
            "ID in the source channel (Beds24 guest UID, Airbnb/Booking guest "
            "reference). Empty for direct channel until first message."
        ),
        required=False,
    )

    channel = schema.Choice(
        title=_("Channel"),
        vocabulary="estades.delta.vocabularies.MessageChannels",
        required=True,
        default="direct",
    )

    language = schema.Choice(
        title=_("Language"),
        description=_(
            "Locked language of the conversation (one of ca/es/en/fr/de). "
            "Set to the first detected language and not changed afterwards "
            "to avoid mid-conversation language flips."
        ),
        vocabulary="estades.delta.vocabularies.PreferredLanguages",
        required=False,
    )

    mode = schema.Choice(
        title=_("Mode"),
        description=_(
            "manual = IA only stores suggestions; assisted = owner approves "
            "before send; autonomous = IA sends approved-FAQ answers directly."
        ),
        vocabulary="estades.delta.vocabularies.ConversationModes",
        required=True,
        default="assisted",
    )

    last_activity = schema.Datetime(
        title=_("Last activity"),
        description=_("Updated on every inbound or outbound message."),
        required=False,
    )


@implementer(IGuestConversation)
class GuestConversation(Container):
    """Container of GuestMessage children for one guest thread."""
