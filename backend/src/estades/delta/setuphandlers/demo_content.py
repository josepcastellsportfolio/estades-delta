"""Create demo Property objects under the default language tree.

Called from the `estades.delta.demo_content` GenericSetup import step only
when the environment variable CREATE_DEMO_CONTENT=1 is set.  Never runs in
production — the guard is intentional.

The three demo properties are created at:
  /Plone/ca/properties/casa-demo-riumar  (palette: arrossar  — default)
  /Plone/ca/properties/casa-test-riu-i-mar (palette: riu-i-mar)
  /Plone/ca/properties/casa-test-capvespre (palette: capvespre)

Volto routes them as:
  /properties/casa-demo-riumar  →  (multilingual prepends /ca/)
  /properties/casa-test-riu-i-mar
  /properties/casa-test-capvespre

The VOLTO_TENANT_MAP in docker-compose.dev.yml maps the *.estadesdelta.local
subdomains to these paths.
"""

import logging
import os

from plone import api
from plone.api.exc import InvalidParameterError


logger = logging.getLogger(__name__)

_DEMO_PROPERTIES = [
    {
        "id": "casa-demo-riumar",
        "title": "Casa Demo Riumar",
        "subtitle": "Xalet de prova amb vistes al delta",
        "short_name": "casa-demo-riumar",
        "municipality": "Riumar",
        "zone": "Riumar",
        "palette": "arrossar",
        "max_guests": 6,
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["Piscina", "Wi-Fi", "Aparcament", "Barbacoa", "Aire condicionat"],
        "base_price_low_season": 85.0,
        "base_price_mid_season": 110.0,
        "base_price_high_season": 155.0,
        "cleaning_fee": 60.0,
        "tourist_tax_per_night": 1.10,
    },
    {
        "id": "casa-test-riu-i-mar",
        "title": "Casa Test Riu i Mar",
        "subtitle": "Apartament de prova a primera línia de mar",
        "short_name": "casa-test-riu-i-mar",
        "municipality": "l'Ampolla",
        "zone": "l'Ampolla",
        "palette": "riu-i-mar",
        "max_guests": 4,
        "bedrooms": 2,
        "bathrooms": 1,
        "amenities": ["Terrassa", "Wi-Fi", "Vistes al mar"],
        "base_price_low_season": 70.0,
        "base_price_mid_season": 95.0,
        "base_price_high_season": 140.0,
        "cleaning_fee": 45.0,
        "tourist_tax_per_night": 1.10,
    },
    {
        "id": "casa-test-capvespre",
        "title": "Casa Test Capvespre",
        "subtitle": "Mas rural de prova per a escapades tranquil·les",
        "short_name": "casa-test-capvespre",
        "municipality": "Poblenou del Delta",
        "zone": "Poblenou del Delta",
        "palette": "capvespre",
        "max_guests": 8,
        "bedrooms": 4,
        "bathrooms": 2,
        "amenities": ["Jardí", "Wi-Fi", "Cuina equipada", "Bicicletes"],
        "base_price_low_season": 100.0,
        "base_price_mid_season": 130.0,
        "base_price_high_season": 185.0,
        "cleaning_fee": 75.0,
        "tourist_tax_per_night": 1.10,
    },
]


def _ensure_folder(parent, folder_id: str, folder_title: str):
    """Return existing folder or create a new one."""
    if folder_id in parent.objectIds():
        return parent[folder_id]
    folder = api.content.create(
        container=parent,
        type="Folder",
        id=folder_id,
        title=folder_title,
    )
    api.content.transition(obj=folder, transition="publish")
    logger.info("Created folder: %s", folder.absolute_url())
    return folder


def _create_property(container, data: dict):
    """Create a single Property; skip if it already exists."""
    prop_id = data["id"]
    if prop_id in container.objectIds():
        logger.info("Demo property already exists, skipping: %s", prop_id)
        return

    prop_data = {k: v for k, v in data.items() if k != "id"}
    obj = api.content.create(
        container=container,
        type="Property",
        id=prop_id,
        **prop_data,
    )
    api.content.transition(obj=obj, transition="publish")
    logger.info("Created demo Property: %s", obj.absolute_url())


def create_demo_content(context=None):
    """GenericSetup import step: create demo Properties if env var is set.

    Args:
        context: GenericSetup import context (unused but required by signature).
    """
    if os.environ.get("CREATE_DEMO_CONTENT", "0") != "1":
        logger.info(
            "CREATE_DEMO_CONTENT is not '1' — skipping demo content creation."
        )
        return

    portal = api.portal.get()
    if portal is None:
        logger.warning("No Plone portal found — skipping demo content creation.")
        return

    # plone.app.multilingual creates language folders (ca, es, ...) at site root.
    # Properties should be created under /Plone/ca/properties/.
    try:
        ca_folder = portal["ca"]
    except KeyError:
        logger.warning(
            "Language folder 'ca' not found in portal root. "
            "Is plone.app.multilingual installed and site language set to 'ca'? "
            "Skipping demo content creation."
        )
        return

    properties_folder = _ensure_folder(ca_folder, "properties", "Properties")

    for prop_data in _DEMO_PROPERTIES:
        try:
            _create_property(properties_folder, prop_data)
        except InvalidParameterError as exc:
            logger.error(
                "Could not create demo Property '%s': %s",
                prop_data["id"],
                exc,
            )
    import transaction

    transaction.commit()
    logger.info("Demo content creation complete.")
