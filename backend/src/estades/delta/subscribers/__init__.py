"""Content-event subscribers for the RAG indexer (ADR-022).

Indexing is driven by publish/edit/remove events so the vector store tracks the
*published* prose an editor would expect the assistant to answer from:

  - published (workflow transition into `published`)  → index
  - modified while published                          → re-index
  - retracted / rejected (transition out of published)→ de-index
  - removed                                           → de-index

Only indexable types (currently Property, per content_indexing.INDEXED_FIELDS)
do anything; everything else is ignored. All work is enqueued to Celery, so
these handlers stay fast and never block the request/transaction.
"""

from __future__ import annotations

from estades.delta import logger
from estades.delta.adapters.content_indexing import enqueue_deindex
from estades.delta.adapters.content_indexing import enqueue_index
from estades.delta.adapters.content_indexing import is_indexable
from plone import api
from plone.uuid.interfaces import IUUID


PUBLISHED_STATE = "published"


def _is_published(obj) -> bool:
    try:
        return api.content.get_state(obj=obj) == PUBLISHED_STATE
    except Exception:
        return False


def on_transition(obj, event):
    """Index on transition into published, de-index on transition out of it."""
    if not is_indexable(obj):
        return
    new_state = getattr(event, "new_state", None)
    new_state_id = getattr(new_state, "getId", lambda: None)()
    old_state = getattr(event, "old_state", None)
    old_state_id = getattr(old_state, "getId", lambda: None)()
    if new_state_id == PUBLISHED_STATE:
        enqueue_index(obj)
    elif old_state_id == PUBLISHED_STATE:
        enqueue_deindex(IUUID(obj))


def on_modified(obj, event):
    """Re-index a published object when its content changes."""
    if not is_indexable(obj):
        return
    if _is_published(obj):
        enqueue_index(obj)


def on_removed(obj, event):
    """De-index when an indexable object is removed."""
    if not is_indexable(obj):
        return
    try:
        uid = IUUID(obj)
    except Exception:
        logger.debug("Removed object had no UID; skipping de-index")
        return
    enqueue_deindex(uid)
