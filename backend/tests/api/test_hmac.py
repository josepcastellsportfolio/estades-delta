"""Tests for webhook HMAC signature verification logic.

These test the _verify_hmac method directly without needing a running
Plone instance, by instantiating the service class minimally.
"""

import hashlib
import hmac
import json


def _sign(payload_bytes: bytes, secret: str) -> str:
    return hmac.HMAC(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()


class TestHMACVerification:

    def test_valid_signature(self):
        from estades.delta.api.messaging_webhook import MessagingWebhookPost

        service = MessagingWebhookPost.__new__(MessagingWebhookPost)
        secret = "test-secret-123"
        raw = b'{"body":"hello","channel":"direct"}'
        signature = _sign(raw, secret)
        assert service._verify_hmac(raw, secret, signature) is True

    def test_invalid_signature(self):
        from estades.delta.api.messaging_webhook import MessagingWebhookPost

        service = MessagingWebhookPost.__new__(MessagingWebhookPost)
        secret = "test-secret-123"
        raw = b'{"body":"hello"}'
        assert service._verify_hmac(raw, secret, "bad-signature") is False

    def test_signature_against_raw_bytes_not_reserialized(self):
        """The HMAC must verify against the exact wire bytes, not re-serialized JSON.

        This test ensures that whitespace and key ordering in the raw payload
        are preserved during verification.
        """
        from estades.delta.api.messaging_webhook import MessagingWebhookPost

        service = MessagingWebhookPost.__new__(MessagingWebhookPost)
        secret = "test-secret-456"

        raw_with_whitespace = b'{ "body" :  "hello" ,  "channel" : "direct" }'
        signature = _sign(raw_with_whitespace, secret)
        assert service._verify_hmac(raw_with_whitespace, secret, signature) is True

        canonical = json.dumps(
            json.loads(raw_with_whitespace), sort_keys=True, separators=(",", ":")
        ).encode()
        wrong_sig = _sign(canonical, secret)
        assert service._verify_hmac(raw_with_whitespace, secret, wrong_sig) is False

    def test_string_body_encoded_to_bytes(self):
        from estades.delta.api.messaging_webhook import MessagingWebhookPost

        service = MessagingWebhookPost.__new__(MessagingWebhookPost)
        secret = "test-secret"
        raw_str = '{"body":"hello"}'
        signature = _sign(raw_str.encode(), secret)
        assert service._verify_hmac(raw_str, secret, signature) is True
