"""Celery application for estades.delta async tasks.

Used by the `worker` and `beat` services in docker-compose. The Plone
process itself does NOT import this module at startup — it's only loaded
by the Celery CLI (`celery -A estades.delta.celery_app worker`).

Tasks that need to read/write Plone content use a Zope-aware helper
(`with plone_context(site_path) as portal: ...`) so they can access the
ZODB inside a proper transaction.
"""

from __future__ import annotations

import os

from celery import Celery
from celery.schedules import crontab


app = Celery("estades.delta")

app.conf.update(
    broker_url=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/1"),
    result_backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/2"),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone=os.environ.get("SCHEDULED_MESSAGES_TZ", "Europe/Madrid"),
    enable_utc=True,
    task_default_queue="messaging",
    task_routes={
        "estades.delta.tasks.pipeline.*": {"queue": "messaging"},
        "estades.delta.tasks.scheduled.*": {"queue": "scheduled"},
        "estades.delta.tasks.embeddings.*": {"queue": "embeddings"},
    },
    beat_schedule={
        "scan-upcoming-checkins": {
            "task": "estades.delta.tasks.scheduled.scan_upcoming_checkins",
            "schedule": crontab(minute="*/30"),
        },
    },
)

app.autodiscover_tasks(["estades.delta"], related_name="tasks")
