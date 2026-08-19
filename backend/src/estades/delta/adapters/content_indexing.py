"""Plone-side content extraction for the RAG indexer.

Runs *with* ZODB context (unlike the Celery task): reads the prose fields off a
content object, builds the plain `document` dict the worker expects, and enqueues
index_content. Keeping the ZODB-touching part here — and the pure chunk/embed
part in the task — respects the worker's lack of Plone context (same split the
M1 messaging pipeline uses).

The prose indexed for a Property (ADR-022): its own long-form copy plus the
owner-curated knowledge-base RichText fields. These are RichText (HTML), NOT
Volto blocks — the html_to_text step in chunking.py handles the markup.
"""

from __future__ import annotations

from estades.delta import logger
from plone.uuid.interfaces import IUUID


# Prose-bearing fields to index, by portal_type. Values are RichText (raw HTML)
# or plain text; the worker strips HTML either way. Dublin Core title/description
# are added separately (they are not RichText).
INDEXED_FIELDS = {
    "Property": (
        "long_description",
        "house_rules",
        # IKnowledgeBase behavior fields (owner-curated prose the IA may quote):
        "parking_instructions",
        "check_in_instructions",
        "check_out_instructions",
        "house_rules_kb",
        "local_recommendations",
        "emergency_contacts",
    ),
}


def _field_text(value) -> str:
    """Return the raw text of a field value (RichText → .raw, else str)."""
    if value is None:
        return ""
    if hasattr(value, "raw"):
        return value.raw or ""
    return str(value)


def extract_document(obj) -> dict | None:
    """Build the plain indexer document dict for a content object.

    Returns None if the object's type isn't indexable. Includes Dublin Core
    title/description alongside the type-specific prose fields.
    """
    field_names = INDEXED_FIELDS.get(obj.portal_type)
    if field_names is None:
        return None

    fields: dict[str, str] = {}
    # Dublin Core prose — description is a useful short summary to index.
    description = getattr(obj, "description", "") or ""
    if description:
        fields["description"] = description
    for name in field_names:
        text = _field_text(getattr(obj, name, None))
        if text.strip():
            fields[name] = text

    return {
        "source_uid": IUUID(obj),
        "url": obj.absolute_url(),
        "title": obj.Title(),
        "portal_type": obj.portal_type,
        "fields": fields,
    }


def is_indexable(obj) -> bool:
    """True if this object's type carries prose we index for RAG."""
    return getattr(obj, "portal_type", None) in INDEXED_FIELDS


def enqueue_index(obj) -> bool:
    """Extract `obj` and enqueue index_content. Returns True if enqueued.

    Import of the Celery task is deferred so importing this module in a context
    without the worker configured (e.g. some tests) doesn't pull in Celery.
    """
    document = extract_document(obj)
    if document is None:
        return False
    if not document["fields"]:
        # No prose to index — make sure any stale chunks are removed instead.
        return enqueue_deindex(document["source_uid"])

    from estades.delta.tasks.embeddings import index_content

    index_content.delay(document)
    logger.info("Enqueued content index for %s", document["source_uid"])
    return True


def enqueue_deindex(source_uid: str) -> bool:
    """Enqueue removal of a content object's chunks. Returns True if enqueued."""
    from estades.delta.tasks.embeddings import deindex_content

    deindex_content.delay(source_uid)
    logger.info("Enqueued content de-index for %s", source_uid)
    return True
