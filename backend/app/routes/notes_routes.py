from flask import jsonify

from app.services.note_service import NoteService


def get_note_by_slug(slug: str):
    data = NoteService.get_note_with_versions(slug=slug)
    return jsonify(data)


def get_note_by_topic(topic_id: int):
    data = NoteService.get_note_for_topic(topic_id)
    return jsonify(data)


def get_all_notes():
    notes = NoteService.get_all_notes()
    return jsonify({"notes": notes})
