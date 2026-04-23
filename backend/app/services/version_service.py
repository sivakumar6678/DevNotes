from sqlalchemy import inspect, text

from app.models import NoteVersion, VersionType
from app.services.note_service import NoteService
from app.utils.db import db
from app.utils.content_validation import validate_note_content
from app.utils.errors import ValidationError


class VersionService:
    @staticmethod
    def _autocommit_conn():
        """Return a raw connection with autocommit enabled.

        PostgreSQL DDL (ALTER TABLE, ALTER TYPE) must NOT run inside a
        transaction block.  Using AUTOCOMMIT ensures each statement is
        committed immediately and a failure in one statement cannot roll
        back a previously successful one.
        """
        return db.engine.connect().execution_options(isolation_level="AUTOCOMMIT")

    @staticmethod
    def ensure_note_version_schema() -> None:
        """
        Idempotent schema migration for the `note_versions` table.

        Adds any missing columns and enum values so the ORM model stays in sync
        with the live database.  Each DDL statement runs under AUTOCOMMIT so:

        - A failure in enum extension cannot roll back column additions.
        - Multiple concurrent startup calls are safe (IF NOT EXISTS guards).
        """
        inspector = inspect(db.engine)
        if "note_versions" not in inspector.get_table_names():
            return

        existing_columns = {col["name"] for col in inspector.get_columns("note_versions")}

        # ── Column migrations ─────────────────────────────────────────────────
        # Each entry is (column_name, DDL).  We check existence first so the
        # log output is clean and we avoid unnecessary round-trips.
        column_migrations = [
            (
                "note_id",
                "ALTER TABLE note_versions "
                "ADD COLUMN IF NOT EXISTS note_id INTEGER "
                "REFERENCES notes(id) ON DELETE CASCADE",
            ),
            (
                "is_published",
                "ALTER TABLE note_versions "
                "ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE",
            ),
            (
                "created_by",
                "ALTER TABLE note_versions "
                "ADD COLUMN IF NOT EXISTS created_by INTEGER "
                "REFERENCES users(id) ON DELETE SET NULL",
            ),
            (
                "updated_by",
                "ALTER TABLE note_versions "
                "ADD COLUMN IF NOT EXISTS updated_by INTEGER "
                "REFERENCES users(id) ON DELETE SET NULL",
            ),
            (
                "created_at",
                "ALTER TABLE note_versions "
                "ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            ),
            (
                "updated_at",
                "ALTER TABLE note_versions "
                "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
            ),
        ]

        pending = [(col, ddl) for col, ddl in column_migrations if col not in existing_columns]

        if pending:
            with VersionService._autocommit_conn() as conn:
                for col, ddl in pending:
                    try:
                        conn.execute(text(ddl))
                        print(f"[note_versions] ✅ Added column '{col}'.")
                    except Exception as exc:
                        # Column likely appeared between inspect and execute — safe to ignore.
                        print(f"[note_versions] ⚠️  Column '{col}' skipped: {exc}")
        else:
            print("[note_versions] All columns already present — no column migrations needed.")

        # ── Extend version_type enum ──────────────────────────────────────────
        # ALTER TYPE ... ADD VALUE cannot run inside a transaction block in
        # PostgreSQL, making AUTOCOMMIT mandatory here.
        new_enum_values = ["revision", "realtime", "theory"]
        with VersionService._autocommit_conn() as conn:
            for vt in new_enum_values:
                try:
                    conn.execute(
                        text(f"ALTER TYPE version_type_enum ADD VALUE IF NOT EXISTS '{vt}'")
                    )
                except Exception as exc:
                    print(f"[note_versions] Enum value '{vt}' skipped: {exc}")

        # ── Unique constraint on (note_id, version_type) ────────────────────
        try:
            # Re-inspect after column additions.
            fresh_inspector = inspect(db.engine)
            existing_constraints = {
                c["name"] for c in fresh_inspector.get_unique_constraints("note_versions")
            }
            if "uq_note_version_type" not in existing_constraints:
                with VersionService._autocommit_conn() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE note_versions "
                            "ADD CONSTRAINT uq_note_version_type "
                            "UNIQUE (note_id, version_type)"
                        )
                    )
                print("[note_versions] ✅ Added unique constraint uq_note_version_type.")
        except Exception as exc:
            print(f"[note_versions] Constraint skipped (may already exist): {exc}")

    # ── Public API ────────────────────────────────────────────────────────────

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
    def upsert_version(
        *,
        topic_id: int | None,
        version_type: str,
        content,
        user_id: int | None = None,
    ) -> dict:
        from app.models import Note, Topic
        vt = VersionService._parse_version_type(version_type)

        if topic_id is None:
            raise ValidationError("`topic_id` is required.")

        topic = db.session.get(Topic, topic_id)
        if not topic:
            from app.utils.errors import NotFoundError
            raise NotFoundError(f"Topic {topic_id} not found.")

        # Step 1: Check if a note already exists for the given topic_id
        note = Note.query.filter_by(topic_id=topic_id).first()

        # Step 2: If not exists → create a new note
        if not note:
            note = Note(
                topic_id=topic_id,
                title=topic.name,
                slug=topic.slug,
                created_by=user_id
            )
            db.session.add(note)
            db.session.commit()
            print(f"Created new note for topic {topic_id}")

        # Step 3: Use note.id to insert into note_versions
        print("Topic ID:", topic_id)
        print("Note ID:", note.id)

        validated = validate_note_content(content)

        existing = NoteVersion.query.filter_by(note_id=note.id, version_type=vt).first()
        if existing:
            existing.content = validated
            existing.updated_by = user_id
            db.session.commit()
            return {
                "message": "Note version saved",
                "id": existing.id,
                "note_id": note.id,
                "version_type": existing.version_type.value,
                "content": existing.content,
            }

        nv = NoteVersion(
            note_id=note.id,
            version_type=vt,
            content=validated,
            is_published=False,
            created_by=user_id
        )
        db.session.add(nv)
        db.session.commit()
        return {
            "message": "Note version saved",
            "id": nv.id,
            "note_id": note.id,
            "version_type": nv.version_type.value,
            "content": nv.content,
        }
