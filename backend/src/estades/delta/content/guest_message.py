"""GuestMessage content type — a single message in a GuestConversation.

GuestMessages are leaves (Items, not folderish). The vector embedding is
stored OUT-of-band in a pgvector table keyed by the message UID (see
adapters/embedding_store.py); we don't put the vector on the dexterity
object because RelStorage is not the right place for hot-path vector
similarity queries.
"""

from estades.delta import _
from plone.dexterity.content import Item
from plone.supermodel import model
from zope import schema
from zope.interface import implementer


class IGuestMessage(model.Schema):
    """Dexterity schema for the GuestMessage content type."""

    direction = schema.Choice(
        title=_("Direction"),
        vocabulary="estades.delta.vocabularies.MessageDirections",
        required=True,
    )

    body = schema.Text(
        title=_("Body"),
        description=_("Raw text payload as received from the channel."),
        required=True,
    )

    language_detected = schema.TextLine(
        title=_("Detected language"),
        description=_("ISO 639-1 code returned by the LLM language detector."),
        required=False,
    )

    classification = schema.Choice(
        title=_("Classification"),
        vocabulary="estades.delta.vocabularies.MessageClassifications",
        required=False,
        default="unclassified",
    )

    classification_confidence = schema.Float(
        title=_("Classification confidence"),
        description=_("0.0 - 1.0 score reported by the LLM classifier."),
        required=False,
    )

    ia_suggested_response = schema.Text(
        title=_("IA suggested response"),
        description=_(
            "Stored on outbound messages when the IA prepared a draft. The "
            "owner can approve, edit or discard via the admin UI."
        ),
        required=False,
    )

    ia_sent = schema.Bool(
        title=_("Sent autonomously by IA"),
        description=_(
            "True only for outbound messages the autonomous mode sent without "
            "human approval. Used for auditability."
        ),
        required=False,
        default=False,
    )

    human_approved_by = schema.TextLine(
        title=_("Approved by"),
        description=_("Username of the owner/operator who approved the send."),
        required=False,
    )

    external_message_id = schema.TextLine(
        title=_("External message ID"),
        description=_(
            "ID from the originating channel (Beds24 / WhatsApp). Used for "
            "idempotency on webhook replays."
        ),
        required=False,
    )


@implementer(IGuestMessage)
class GuestMessage(Item):
    """A single inbound or outbound message."""
