"""Celery tasks for the messaging IA pipeline.

Submodules are imported here so that `@app.task` decorators register
when Celery autodiscovers `estades.delta.tasks`.
"""

from estades.delta.tasks import embeddings  # noqa: F401
from estades.delta.tasks import pipeline  # noqa: F401
from estades.delta.tasks import scheduled  # noqa: F401
