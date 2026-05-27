"""Zope-aware context manager for Celery tasks that need ZODB access.

Celery workers run outside the Zope application server, so they don't have
a request, a transaction manager, or a site. This module provides a context
manager that bootstraps a minimal Zope environment so tasks can use
plone.api to query/modify content.

Usage inside a Celery task::

    from estades.delta.zope_context import plone_context

    @app.task
    def my_task():
        with plone_context() as (app, portal):
            results = plone.api.content.find(portal_type="Booking")
            ...
        # transaction committed on clean exit, aborted on exception

Requires the ZOPE_CONF or INSTANCE_HOME env var to be set (the backend
Docker image sets these).

NOTE: Uses thread-local security manager (newSecurityManager). Safe with
Celery's default prefork pool. NOT safe with gevent/eventlet pools where
green threads share thread-locals — if we ever switch pool type, this
needs a per-greenlet security context.
"""

from __future__ import annotations

import os
import transaction

from contextlib import contextmanager
from estades.delta import logger


@contextmanager
def plone_context(site_path: str | None = None):
    """Bootstrap Zope app + Plone site for use in a Celery worker.

    Yields (app, portal) inside a transaction. Commits on clean exit,
    aborts on exception.
    """
    site_path = site_path or os.environ.get("SITE", "Plone")
    app = None

    try:
        try:
            from Zope2 import app as open_app
        except ImportError:
            from Testing.makerequest import makerequest
            import Zope2
            Zope2.startup()
            app = makerequest(Zope2.app())
        else:
            app = open_app()

        from Testing.makerequest import makerequest
        app = makerequest(app)

        from zope.globalrequest import setRequest
        setRequest(app.REQUEST)

        portal = app.unrestrictedTraverse(site_path)

        from zope.component.hooks import setSite
        setSite(portal)

        from AccessControl.SecurityManagement import newSecurityManager
        from AccessControl.users import SimpleUser
        admin = SimpleUser("admin", "", ["Manager"], [])
        newSecurityManager(None, admin.__of__(portal.acl_users))

        yield app, portal

        transaction.commit()

    except Exception:
        transaction.abort()
        raise
    finally:
        from AccessControl.SecurityManagement import noSecurityManager
        noSecurityManager()

        from zope.component.hooks import setSite
        setSite(None)

        try:
            from zope.globalrequest import setRequest
            setRequest(None)
        except ImportError:
            pass

        if app is not None and getattr(app, "_p_jar", None) is not None:
            app._p_jar.close()
