"""Upgrade steps for estades.delta.

Each step is wired in upgrades/configure.zcml. We keep them in this single
module for as long as the list is small; split per profile version when it
grows.
"""

from plone import api


DEFAULT_PALETTE = "arrossar"


def assign_default_palette_to_existing_properties(_context) -> None:
    """Profile 1000 -> 1001: backfill Property.palette.

    The `palette` field was added in 1001. Any Property created against the
    1000 schema has no value yet; the dexterity default would already kick in
    on attribute access, but explicitly persisting `arrossar` keeps the
    catalog and the JSON serialiser in agreement.
    """
    catalog = api.portal.get_tool("portal_catalog")
    brains = catalog.unrestrictedSearchResults(portal_type="Property")
    fixed = 0
    for brain in brains:
        obj = brain.getObject()
        if getattr(obj, "palette", None) in (None, ""):
            obj.palette = DEFAULT_PALETTE
            obj.reindexObject(idxs=[])
            fixed += 1
    if fixed:
        import logging

        logging.getLogger("estades.delta").info(
            "upgrade 1000->1001: backfilled palette=%s on %d Property objects",
            DEFAULT_PALETTE,
            fixed,
        )
