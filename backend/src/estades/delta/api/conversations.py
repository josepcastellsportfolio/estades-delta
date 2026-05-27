"""GET /++api++/@conversations — list guest conversations.

Returns conversations visible to the current user, ordered by last activity.
Property owners see only their properties' conversations. Site managers see all.
"""

from __future__ import annotations

from plone.restapi.services import Service

import plone.api


class ConversationsGet(Service):

    def reply(self):
        portal = plone.api.portal.get()
        current_user = plone.api.user.get_current()

        limit = min(int(self.request.get("limit", 20)), 100)
        offset = int(self.request.get("offset", 0))

        query = {
            "portal_type": "GuestConversation",
            "sort_on": "modified",
            "sort_order": "descending",
            "b_size": limit,
            "b_start": offset,
        }

        state_filter = self.request.get("state")
        if state_filter:
            query["review_state"] = state_filter

        is_manager = plone.api.user.has_permission(
            "Manage portal", obj=portal
        )

        if not is_manager:
            query["Creator"] = current_user.getId()

        brains = plone.api.content.find(**query)

        results = []
        for brain in brains:
            results.append({
                "uid": brain.UID,
                "title": brain.Title,
                "url": brain.getURL(),
                "channel": getattr(brain, "channel", ""),
                "review_state": brain.review_state,
                "modified": brain.modified.ISO8601() if brain.modified else None,
            })

        return {
            "items": results,
            "total": len(brains),
            "limit": limit,
            "offset": offset,
        }
