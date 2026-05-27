"""Custom catalog indexers for estades.delta content types."""

from estades.delta.content.guest_conversation import IGuestConversation
from estades.delta.content.guest_message import IGuestMessage
from plone.indexer.decorator import indexer


@indexer(IGuestConversation)
def conversation_mode(obj):
    return getattr(obj, "mode", None)


@indexer(IGuestConversation)
def channel(obj):
    return getattr(obj, "channel", None)


@indexer(IGuestConversation)
def last_activity(obj):
    return getattr(obj, "last_activity", None)


@indexer(IGuestMessage)
def external_message_id(obj):
    return getattr(obj, "external_message_id", None)


@indexer(IGuestMessage)
def direction(obj):
    return getattr(obj, "direction", None)


@indexer(IGuestMessage)
def classification(obj):
    return getattr(obj, "classification", None)
