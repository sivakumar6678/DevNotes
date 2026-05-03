from flask import jsonify, request

from app.extensions import cache
from app.services.note_service import NoteService

# Cache TTL for individual note+version responses (seconds)
_NOTE_CACHE_TTL = 300  # 5 minutes


def _note_cache_key() -> str:
    """Build a unique cache key from the URL slug and ?version= param."""
    slug = request.view_args.get("slug", "")
    version = (request.args.get("version", "industry") or "industry").strip().lower()
    return f"note_{slug}_{version}"


@cache.cached(timeout=_NOTE_CACHE_TTL, key_prefix=_note_cache_key)
def get_note_by_slug(slug: str):
    """GET /api/notes/<slug>?version=<version_type>

    Returns only the requested version of a note.  Defaults to ``industry``
    when the ``version`` query-string parameter is omitted.
    """
    version_type = request.args.get("version", "industry").strip() or "industry"
    data = NoteService.get_note_by_slug_and_version(slug=slug, version_type=version_type)
    return jsonify(data)


def get_note_by_topic(topic_id: int):
    data = NoteService.get_note_for_topic(topic_id)
    return jsonify(data)


def get_all_notes():
    notes = NoteService.get_all_notes()
    return jsonify({"notes": notes})
