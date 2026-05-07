from app.utils.db import db
from app.models import Note, NoteVersion, Topic
from app.models.note_version import VersionType
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify


def _build_demo_note(title: str, topic: str, slug: str) -> dict:
    return {
        "id": None,
        "slug": slug,
        "title": title,
        "topic": topic,
        "versions": {
            "simple": {
                "definition": f"{title} is a core {topic} concept explained in a beginner-friendly way.",
                "problem_it_solves": f"It helps learners understand where {title.lower()} fits into everyday {topic} work.",
                "detailed_explanation": f"This demo note exists so the learning flow stays complete while the full content library is still growing.",
                "core_concepts": [
                    {"name": "Purpose", "explanation": f"Understand why {title.lower()} matters in {topic}."},
                    {"name": "Usage", "explanation": f"See how {title.lower()} appears in real developer workflows."},
                ],
                "how_it_works": f"Start with the core idea, then connect it to code you will actually write in {topic}.",
                "syntax": f"// Example placeholder for {title.lower()}",
                "code_example": f"console.log('{title} note coming soon')",
                "practical_example": f"Use {title.lower()} while building real features in {topic}.",
                "real_world_example": f"Teams rely on {title.lower()} when shipping maintainable {topic} code.",
                "common_mistakes": [f"Learning {title.lower()} in isolation without connecting it to practical use."],
                "best_practices": [f"Pair theory with a small hands-on example for {title.lower()}."],
                "interview_notes": [f"Explain what {title.lower()} is, why it matters, and where it is used."],
            },
            "industry": {
                "definition": f"{title} is a practical {topic} concept that shows up in production-oriented code and team workflows.",
                "problem_it_solves": f"It gives developers a stronger mental model for writing better {topic} applications.",
                "detailed_explanation": f"This fallback note keeps the note route working for {title.lower()} until richer backend content is added.",
                "core_concepts": [
                    {"name": "Production relevance", "explanation": f"{title} matters because it directly affects maintainability and implementation quality."},
                    {"name": "Developer communication", "explanation": f"Clear understanding of {title.lower()} improves code reviews and design discussions."},
                ],
                "how_it_works": f"Treat {title.lower()} as both a concept to understand and a pattern to recognize in real codebases.",
                "syntax": f"// Industry-oriented example for {title.lower()}",
                "code_example": f"console.log('Production example for {title}')",
                "practical_example": f"Apply {title.lower()} while building a small feature and reviewing the tradeoffs.",
                "real_world_example": f"{title} appears in production code, debugging sessions, and interview discussions for {topic}.",
                "common_mistakes": [f"Using {title.lower()} without understanding the surrounding tradeoffs."],
                "best_practices": [f"Learn the baseline concept first, then apply it to real project scenarios."],
                "interview_notes": [f"Use a short definition and one grounded example for {title.lower()}."],
            },
        },
    }


DEMO_NOTES = {
    "closures": _build_demo_note("Closures", "JavaScript", "closures"),
    "promises": _build_demo_note("Promises", "JavaScript", "promises"),
    "components": _build_demo_note("Components", "React", "components"),
    "hooks": _build_demo_note("Hooks", "React", "hooks"),
    "decorators": _build_demo_note("Decorators", "Python", "decorators"),
    "list-comprehensions": _build_demo_note("List Comprehensions", "Python", "list-comprehensions"),
    "joins": _build_demo_note("Joins", "MySQL", "joins"),
    "indexes": _build_demo_note("Indexes", "MySQL", "indexes"),
}


class NoteService:
    @staticmethod
    def _topic_chain(topic: Topic) -> list[Topic]:
        chain: list[Topic] = []
        current = topic

        while current is not None:
            chain.append(current)
            current = current.parent

        return list(reversed(chain))

    @staticmethod
    def _is_leaf_topic(topic: Topic) -> bool:
        return topic.children.count() == 0

    @staticmethod
    def _serialize_leaf_topic(topic: Topic, note: dict | None = None) -> dict:
        topic_chain = NoteService._topic_chain(topic)
        return {
            "id": topic.id,
            "topic_id": topic.id,
            "note_id": note.get("id") if note else None,
            "name": topic.name,
            "title": topic.name,
            "slug": topic.slug,
            "parent_id": topic.parent_id,
            "label": " > ".join(item.name for item in topic_chain),
        }

    @staticmethod
    def _get_leaf_topic_by_reference(*, topic_id: int | None = None, topic_slug: str | None = None) -> Topic:
        topic = None
        if topic_id is not None:
            topic = db.session.get(Topic, topic_id)
        elif topic_slug:
            topic = Topic.query.filter_by(slug=topic_slug).first()

        if not topic:
            raise NotFoundError("Topic not found.")
        if not NoteService._is_leaf_topic(topic):
            raise ValidationError("Only leaf topics can be used as notes.")

        return topic

    @staticmethod
    def get_note_for_topic(topic_id: int) -> dict:
        topic = db.session.get(Topic, topic_id)
        if not topic:
            raise NotFoundError("Topic not found.")
        if not NoteService._is_leaf_topic(topic):
            raise ValidationError("Only topic-level nodes can have notes.")

        note = Note.query.filter_by(topic_id=topic.id).first()
        if not note:
            # Fallback for old data or if note wasn't created yet
            return {
                "topic": {
                    "id": topic.id,
                    "name": topic.name,
                    "slug": topic.slug,
                    "node_type": topic.node_type,
                    "technology_id": topic.technology_id,
                    "breadcrumb": " > ".join(item.name for item in NoteService._topic_chain(topic)),
                },
                "note": None,
                "versions": {},
            }

        versions = (
            NoteVersion.query.filter_by(note_id=note.id)
            .order_by(NoteVersion.version_type.asc())
            .all()
        )
        versions_map = {version.version_type.value: version.content for version in versions}

        return {
            "topic": {
                "id": topic.id,
                "name": topic.name,
                "slug": topic.slug,
                "node_type": topic.node_type,
                "technology_id": topic.technology_id,
                "breadcrumb": " > ".join(item.name for item in NoteService._topic_chain(topic)),
            },
            "note": {
                "id": note.id,
                "topic_id": topic.id,
                "title": note.title,
                "slug": note.slug,
            },
            "versions": versions_map,
        }

    @staticmethod
    def get_all_notes() -> list[dict]:
        notes = Note.query.all()
        if not notes:
            return []

        note_ids = [n.id for n in notes]
        versions = NoteVersion.query.filter(NoteVersion.note_id.in_(note_ids)).all()
        versions_by_note_id = {}
        for version in versions:
            versions_by_note_id.setdefault(version.note_id, {})[version.version_type.value] = version.content

        results = []
        for note in notes:
            topic = db.session.get(Topic, note.topic_id)
            if not topic:
                continue
            
            results.append({
                "id": note.id,
                "topic_id": topic.id,
                "name": topic.name,
                "title": note.title,
                "slug": note.slug,
                "parent_id": topic.parent_id,
                "label": " > ".join(item.name for item in NoteService._topic_chain(topic)),
                "versions": versions_by_note_id.get(note.id, {}),
            })
        
        return results

    @staticmethod
    def get_note_with_versions(slug: str) -> dict:
        note = Note.query.filter_by(slug=slug).first()
        if not note:
            demo_note = DEMO_NOTES.get(slug)
            if demo_note:
                return demo_note
            raise NotFoundError("Note not found.")

        topic = db.session.get(Topic, note.topic_id)
        if not topic:
            raise NotFoundError("Associated topic not found.")

        versions = (
            NoteVersion.query.filter_by(note_id=note.id)
            .order_by(NoteVersion.version_type.asc())
            .all()
        )
        versions_map = {v.version_type.value: v.content for v in versions}
        topic_chain = NoteService._topic_chain(topic)
        topic_path = " / ".join(item.name for item in topic_chain[:-1]) if len(topic_chain) > 1 else topic.name

        return {
            "id": note.id,
            "slug": note.slug,
            "title": note.title,
            "topic": topic_path,
            "label": " > ".join(item.name for item in topic_chain),
            "versions": versions_map,
        }

    @staticmethod
    def get_note_by_slug_and_version(slug: str, version_type: str = "industry") -> dict:
        """Return topic details + a single requested version (or fallback).

        Args:
            slug:         The note / topic slug.
            version_type: One of the ``VersionType`` enum values. Defaults to ``"industry"``.

        Returns:
            A dict with keys ``topic``, ``title``, ``version``, ``content``, ``fallback``, and ``available_versions``.

        Raises:
            NotFoundError: When the note slug or no version is found in the database.
        """
        # --- Validate the requested version type early -----------------------
        try:
            requested_vt = VersionType(version_type.lower())
        except ValueError:
            valid = ", ".join(v.value for v in VersionType)
            raise ValidationError(
                f"Invalid version type '{version_type}'. Valid options: {valid}."
            )

        # --- Resolve the note ------------------------------------------------
        note = Note.query.filter_by(slug=slug).first()

        fallback_priority = ["industry", "interview", "theory", "simple", "revision", "real-time"]

        if not note:
            # Fall back to demo notes if available
            demo = DEMO_NOTES.get(slug)
            if demo:
                available = list(demo.get("versions", {}).keys())
                content = demo.get("versions", {}).get(requested_vt.value)
                fallback_occurred = False
                selected_vt = requested_vt.value

                if content is None:
                    fallback_occurred = True
                    selected_vt = None
                    for fp in fallback_priority:
                        if fp in available:
                            selected_vt = fp
                            content = demo.get("versions", {})[fp]
                            break

                if content is None:
                    raise NotFoundError(
                        f"No versions found for demo note '{slug}'."
                    )
                return {
                    "topic": {
                        "id": None,
                        "name": demo.get("title", slug),
                    },
                    "title": demo.get("title", slug),
                    "version": selected_vt,
                    "content": content,
                    "fallback": fallback_occurred,
                    "available_versions": available,
                }
            raise NotFoundError(f"Note '{slug}' not found.")

        # --- Resolve the associated topic ------------------------------------
        topic = db.session.get(Topic, note.topic_id)
        if not topic:
            raise NotFoundError("Associated topic not found.")

        # --- Fetch all versions ----------------------------------------------
        versions = NoteVersion.query.filter_by(note_id=note.id).all()
        versions_map = {v.version_type.value: v.content for v in versions}
        available_versions = list(versions_map.keys())

        fallback_occurred = False
        selected_vt = requested_vt.value

        if selected_vt not in versions_map:
            fallback_occurred = True
            selected_vt = None
            for fp in fallback_priority:
                if fp in versions_map:
                    selected_vt = fp
                    break
        
        if not selected_vt:
            raise NotFoundError(
                f"No versions found for note '{slug}'."
            )

        return {
            "topic": {
                "id": topic.id,
                "name": topic.name,
            },
            "title": note.title,
            "version": selected_vt,
            "content": versions_map[selected_vt],
            "fallback": fallback_occurred,
            "available_versions": available_versions,
        }

    @staticmethod
    def ensure_note_schema() -> None:
        """Add missing tracking columns to the notes table (incremental migration)."""
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        if "notes" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("notes")}
        migrations = []

        if "created_by" not in columns:
            migrations.append("ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "updated_by" not in columns:
            migrations.append("ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "created_at" not in columns:
            migrations.append("ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
        if "updated_at" not in columns:
            migrations.append("ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

        if migrations:
            with db.engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                for sql in migrations:
                    try:
                        conn.execute(text(sql))
                    except Exception as e:
                        print(f"[notes] Migration error: {e}")
            print(f"[notes] Applied {len(migrations)} schema migration(s).")

