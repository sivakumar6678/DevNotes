from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.services.note_service import NoteService
from app.utils.auth import require_admin_user
from app.utils.errors import ValidationError


def get_note_by_slug(slug: str):
    data = NoteService.get_note_with_versions(slug=slug)
    return jsonify(data)


def get_all_notes():
    notes = NoteService.get_all_notes()
    return jsonify({"notes": notes})


@jwt_required()
def create_note():
    require_admin_user()
    payload = request.get_json(silent=True) or {}

    title = payload.get("title")
    topic_slug = payload.get("topic_slug")
    topic_id = payload.get("topic_id")
    slug = payload.get("slug")

    if not title:
        raise ValidationError("`title` is required.")
    if not (topic_slug or topic_id):
        raise ValidationError("`topic_slug` or `topic_id` is required.")

    note = NoteService.create_note(title=title, topic_slug=topic_slug, topic_id=topic_id, slug=slug)
    return jsonify({"note": note}), 201
