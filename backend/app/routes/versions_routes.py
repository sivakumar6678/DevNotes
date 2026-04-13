from flask import jsonify, request

from app.services.version_service import VersionService
from app.utils.errors import ValidationError


def upsert_note_version():
    payload = request.get_json(silent=True) or {}

    note_slug = payload.get("note_slug")
    note_id = payload.get("note_id")
    version_type = payload.get("version_type")
    content = payload.get("content")

    if not (note_slug or note_id):
        raise ValidationError("`note_slug` or `note_id` is required.")
    if not version_type:
        raise ValidationError("`version_type` is required.")
    if content is None:
        raise ValidationError("`content` is required.")

    version = VersionService.upsert_version(
        note_slug=note_slug,
        note_id=note_id,
        version_type=version_type,
        content=content,
    )
    return jsonify({"note_version": version}), 201

