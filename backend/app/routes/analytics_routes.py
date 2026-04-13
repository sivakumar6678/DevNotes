from flask import jsonify, request

from app.services.analytics_service import AnalyticsService
from app.utils.errors import ValidationError


def track_view():
    payload = request.get_json(silent=True) or {}

    note_slug = payload.get("note_slug")
    note_id = payload.get("note_id")
    version_type = payload.get("version_type")

    if note_id is None and not note_slug:
        raise ValidationError("`note_id` is required.")
    if not version_type:
        raise ValidationError("`version_type` is required.")

    view = AnalyticsService.track_view(note_slug=note_slug, note_id=note_id, version_type=version_type, request=request)
    return jsonify({"view": view}), 201
