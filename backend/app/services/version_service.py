from app.utils.db import db
from app.models import Note, NoteVersion, VersionType
from app.utils.content_validation import validate_note_content
from app.utils.errors import NotFoundError, ValidationError


class VersionService:
    @staticmethod
    def _parse_version_type(value: str) -> VersionType:
        try:
            return VersionType(value)
        except Exception as exc:
            raise ValidationError(
                "Invalid `version_type`.",
                details={"allowed": [v.value for v in VersionType]},
            ) from exc

    @staticmethod
    def upsert_version(*, note_id: int, version_type: str, content) -> dict:
        vt = VersionService._parse_version_type(version_type)

        note = Note.query.get(note_id)
        if not note:
            raise NotFoundError("Note not found.")

        validated = validate_note_content(content)

        existing = NoteVersion.query.filter_by(note_id=note.id, version_type=vt).first()
        if existing:
            existing.content = validated
            db.session.commit()
            return {
                "id": existing.id,
                "note_id": existing.note_id,
                "version_type": existing.version_type.value,
                "content": existing.content,
            }

        nv = NoteVersion(note_id=note.id, version_type=vt, content=validated)
        db.session.add(nv)
        db.session.commit()
        return {"id": nv.id, "note_id": nv.note_id, "version_type": nv.version_type.value, "content": nv.content}
