from flask import jsonify, request

from app.services.analytics_service import AnalyticsService
from app.utils.errors import ValidationError


def track_view():
    payload = request.get_json(silent=True) or {}

    topic_slug = payload.get("topic_slug")
    topic_id = payload.get("topic_id")
    version_type = payload.get("version_type")

    if topic_id is None and not topic_slug:
        raise ValidationError("`topic_id` is required.")
    if not version_type:
        raise ValidationError("`version_type` is required.")

    view = AnalyticsService.track_view(topic_slug=topic_slug, topic_id=topic_id, version_type=version_type, request=request)
    return jsonify({"view": view}), 201
