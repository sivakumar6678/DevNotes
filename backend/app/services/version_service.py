from sqlalchemy import inspect, text

from app.models import NoteVersion, VersionType
from app.services.note_service import NoteService
from app.utils.db import db
from app.utils.content_validation import validate_note_content
from app.utils.errors import NotFoundError, ValidationError


class VersionService:
    @staticmethod
    def ensure_note_version_schema() -> None:
        """Add new columns to note_versions and extend the version_type enum."""
        inspector = inspect(db.engine)
        if "note_versions" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("note_versions")}
        migrations = []

        if "is_published" not in columns:
            migrations.append("ALTER TABLE note_versions ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE")
        if "created_by" not in columns:
            migrations.append("ALTER TABLE note_versions ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "updated_by" not in columns:
            migrations.append("ALTER TABLE note_versions ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "updated_at" not in columns:
            migrations.append("ALTER TABLE note_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

        for sql in migrations:
            db.session.execute(text(sql))

        # Extend the version_type enum with the 3 new values if missing
        # Postgres requires ALTER TYPE ... ADD VALUE (idempotent with IF NOT EXISTS)
        new_types = ["revision", "realtime", "theory"]
        for vt in new_types:
            try:
                db.session.execute(
                    text(f"ALTER TYPE version_type_enum ADD VALUE IF NOT EXISTS '{vt}'")
                )
            except Exception:
                db.session.rollback()

        if migrations:
            db.session.commit()
            print(f"[note_versions] Applied {len(migrations)} schema migration(s).")

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
    def upsert_version(*, note_id: int | None, topic_id: int | None, version_type: str, content) -> dict:
        vt = VersionService._parse_version_type(version_type)

        if note_id is not None:
            raise ValidationError("`note_id` is no longer supported. Use `topic_id` instead.")

        if topic_id is None:
            raise ValidationError("`topic_id` is required.")

        topic = NoteService._get_leaf_topic_by_reference(topic_id=topic_id)
        validated = validate_note_content(content)

        existing = NoteVersion.query.filter_by(topic_id=topic.id, version_type=vt).first()
        if existing:
            existing.content = validated
            db.session.commit()
            return {
                "id": existing.id,
                "topic_id": existing.topic_id,
                "version_type": existing.version_type.value,
                "content": existing.content,
            }

        nv = NoteVersion(topic_id=topic.id, version_type=vt, content=validated)
        db.session.add(nv)
        db.session.commit()
        return {"id": nv.id, "topic_id": nv.topic_id, "version_type": nv.version_type.value, "content": nv.content}
