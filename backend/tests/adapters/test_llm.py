"""Tests for LLM adapters — MockLLMAdapter and protocol conformance."""

from estades.delta.adapters.llm import ClassificationResult
from estades.delta.adapters.llm import GenerationResult
from estades.delta.adapters.llm import ILLMAdapter
from estades.delta.adapters.llm import MockLLMAdapter


def test_mock_implements_protocol():
    assert isinstance(MockLLMAdapter(), ILLMAdapter)


def test_mock_classifies_wifi_as_faq():
    adapter = MockLLMAdapter()
    result = adapter.classify_message("What's the wifi password?", {})
    assert isinstance(result, ClassificationResult)
    assert result.label == "faq"
    assert result.confidence >= 0.9


def test_mock_classifies_emergency_as_urgent():
    adapter = MockLLMAdapter()
    result = adapter.classify_message("There is a water leak, help!", {})
    assert result.label == "urgent"
    assert result.confidence >= 0.85


def test_mock_classifies_generic_as_other():
    adapter = MockLLMAdapter()
    result = adapter.classify_message("What time is checkout?", {})
    assert result.label == "other"


def test_mock_generates_wifi_response_for_faq():
    adapter = MockLLMAdapter()
    classification = ClassificationResult(label="faq", confidence=0.95, language="en")
    kb = {"wifi_ssid": "DeltaNet", "wifi_password": "secret123"}
    result = adapter.generate_response("wifi?", classification, kb, [])
    assert isinstance(result, GenerationResult)
    assert "DeltaNet" in result.text
    assert "secret123" in result.text


def test_mock_generates_fallback_for_non_faq():
    adapter = MockLLMAdapter()
    classification = ClassificationResult(label="other", confidence=0.5, language="en")
    result = adapter.generate_response("hello", classification, {}, [])
    assert "owner" in result.text.lower()


def test_mock_detect_language():
    adapter = MockLLMAdapter()
    assert adapter.detect_language("Hola, com estàs?") == "en"
