from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.services.version_service import VersionService
from app.utils.auth import require_admin_user
from app.utils.errors import ValidationError


@jwt_required()
def upsert_note_version():
    require_admin_user()
    payload = request.get_json(silent=True) or {}

    note_id = payload.get("note_id")
    topic_id = payload.get("topic_id")
    version_type = payload.get("version_type")
    content = payload.get("content")

    if note_id is None and topic_id is None:
        raise ValidationError("`note_id` or `topic_id` is required.")
    if not version_type:
        raise ValidationError("`version_type` is required.")
    if content is None:
        raise ValidationError("`content` is required.")

    version = VersionService.upsert_version(
        note_id=note_id,
        topic_id=topic_id,
        version_type=version_type,
        content=content,
    )
    return jsonify({"note_version": version}), 201
