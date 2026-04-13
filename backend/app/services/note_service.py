from app.utils.db import db
from app.models import Note, NoteVersion, Topic
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify


class NoteService:
    @staticmethod
    def get_note_with_versions(slug: str) -> dict:
        note = Note.query.filter_by(slug=slug).first()
        if not note:
            raise NotFoundError("Note not found.")

        versions = (
            NoteVersion.query.filter_by(note_id=note.id)
            .order_by(NoteVersion.version_type.asc())
            .all()
        )
        versions_map = {v.version_type.value: v.content for v in versions}

        return {
            "id": note.id,
            "title": note.title,
            "topic": note.topic.name,
            "versions": versions_map,
        }

    @staticmethod
    def create_note(*, title: str, topic_slug: str | None, topic_id: int | None, slug: str | None) -> dict:
        topic = None
        if topic_id is not None:
            topic = Topic.query.get(topic_id)
        elif topic_slug:
            topic = Topic.query.filter_by(slug=topic_slug).first()

        if not topic:
            raise NotFoundError("Topic not found.")

        note_slug = slugify(slug or title)
        if Note.query.filter_by(slug=note_slug).first():
            raise ValidationError("A note with this slug already exists.", details={"slug": note_slug})

        note = Note(topic_id=topic.id, title=title, slug=note_slug)
        db.session.add(note)
        db.session.commit()

        return {"id": note.id, "topic_id": note.topic_id, "title": note.title, "slug": note.slug}
