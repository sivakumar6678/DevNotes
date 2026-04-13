from flask import Request

from app.utils.db import db
from app.models import Note, NoteView
from app.services.version_service import VersionService
from app.utils.errors import NotFoundError


class AnalyticsService:
    @staticmethod
    def _get_client_ip(request: Request) -> str | None:
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            # Use the first IP in the chain (client).
            return xff.split(",")[0].strip() or None
        return request.remote_addr

    @staticmethod
    def track_view(*, note_slug: str | None, note_id: int | None, version_type: str, request: Request) -> dict:
        vt = VersionService._parse_version_type(version_type)

        note = None
        if note_id is not None:
            note = Note.query.get(note_id)
        elif note_slug:
            note = Note.query.filter_by(slug=note_slug).first()
        if not note:
            raise NotFoundError("Note not found.")

        view = NoteView(note_id=note.id, version_type=vt, user_ip=AnalyticsService._get_client_ip(request))
        db.session.add(view)
        db.session.commit()

        return {
            "id": view.id,
            "note_id": view.note_id,
            "version_type": view.version_type.value,
            "viewed_at": view.viewed_at.isoformat(),
            "user_ip": view.user_ip,
        }
