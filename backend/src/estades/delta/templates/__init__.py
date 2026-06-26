"""Jinja2 template rendering for scheduled messages."""

from __future__ import annotations

from pathlib import Path

from jinja2 import Environment
from jinja2 import FileSystemLoader


_TEMPLATES_DIR = Path(__file__).parent / "messages"

_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=False,
    trim_blocks=True,
    lstrip_blocks=True,
    keep_trailing_newline=False,
)


def render_message(template_name: str, context: dict) -> str:
    """Render a message template by name (e.g. 'welcome', 'pre_checkin').

    The template receives the full context dict and is responsible for
    language branching internally.
    """
    template = _env.get_template(f"{template_name}.j2")
    return template.render(**context).strip()
