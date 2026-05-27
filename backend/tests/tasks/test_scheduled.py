"""Tests for scheduled messaging tasks."""

import pytest

from estades.delta.templates import render_message


class TestRenderMessage:
    """Test Jinja2 template rendering for all message types and languages."""

    def _base_context(self, **overrides):
        ctx = {
            "guest_name": "Joan",
            "property_title": "Casa Riumar",
            "check_in_date": "2026-06-15",
            "check_out_date": "2026-06-22",
            "language": "en",
            "wifi_ssid": "DeltaNet",
            "wifi_password": "secret123",
            "check_in_instructions": "Lockbox code: 4321",
            "parking_instructions": "Free parking in front of the house",
            "house_rules_kb": "No smoking indoors",
            "local_recommendations": "Try Restaurant El Delta",
            "emergency_contacts": "Owner: +34 600 123 456",
            "check_in_time": "15:00",
        }
        ctx.update(overrides)
        return ctx

    def test_welcome_english(self):
        body = render_message("welcome", self._base_context())
        assert "Joan" in body
        assert "Casa Riumar" in body
        assert "DeltaNet" in body
        assert "secret123" in body
        assert "4321" in body

    def test_welcome_catalan(self):
        body = render_message("welcome", self._base_context(language="ca"))
        assert "Benvingut" in body
        assert "Joan" in body

    def test_welcome_spanish(self):
        body = render_message("welcome", self._base_context(language="es"))
        assert "Bienvenido" in body

    def test_welcome_french(self):
        body = render_message("welcome", self._base_context(language="fr"))
        assert "Bienvenue" in body

    def test_welcome_german(self):
        body = render_message("welcome", self._base_context(language="de"))
        assert "Willkommen" in body

    def test_welcome_without_wifi(self):
        ctx = self._base_context(wifi_ssid=None, wifi_password=None)
        body = render_message("welcome", ctx)
        assert "WiFi" not in body

    def test_pre_checkin_english(self):
        body = render_message("pre_checkin", self._base_context())
        assert "tomorrow" in body.lower() or "starts tomorrow" in body.lower()
        assert "No smoking" in body
        assert "Free parking" in body

    def test_pre_checkin_catalan(self):
        body = render_message("pre_checkin", self._base_context(language="ca"))
        assert "recordatori" in body.lower()

    def test_post_checkin_english(self):
        body = render_message("post_checkin", self._base_context())
        assert "everything alright" in body.lower() or "enjoy" in body.lower()
        assert "+34 600 123 456" in body

    def test_post_checkin_catalan(self):
        body = render_message("post_checkin", self._base_context(language="ca"))
        assert "gaudint" in body.lower()


class TestSendScheduledMessage:
    """Test the send_scheduled_message task with mock messaging adapter."""

    def test_renders_and_sends(self, monkeypatch):
        monkeypatch.setenv("MESSAGING_ADAPTER", "stub")

        from estades.delta.tasks.scheduled import send_scheduled_message

        result = send_scheduled_message(
            booking_uid="test-booking-001",
            message_type="welcome",
            template_context={
                "guest_name": "Joan",
                "property_title": "Casa Riumar",
                "check_in_date": "2026-06-15",
                "check_out_date": "2026-06-22",
                "language": "en",
            },
        )
        assert result["sent"] is True
        assert result["message_type"] == "welcome"
        assert result["external_id"]

    def test_rejects_invalid_type(self, monkeypatch):
        monkeypatch.setenv("MESSAGING_ADAPTER", "stub")

        from estades.delta.tasks.scheduled import send_scheduled_message

        result = send_scheduled_message(
            booking_uid="test-booking-002",
            message_type="invalid_type",
            template_context={"language": "en"},
        )
        assert result["sent"] is False
