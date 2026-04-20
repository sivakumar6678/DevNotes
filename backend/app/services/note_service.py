from app.utils.db import db
from app.models import Note, NoteVersion, Topic
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
    def _serialize_leaf_topic(topic: Topic, note: Note | None = None) -> dict:
        topic_chain = NoteService._topic_chain(topic)
        return {
            "id": topic.id,
            "topic_id": topic.id,
            "note_id": note.id if note else None,
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
    def get_or_create_note_for_topic(topic: Topic) -> Note:
        note = Note.query.filter_by(topic_id=topic.id).first()
        if note:
            return note

        note = Note(topic_id=topic.id, title=topic.name, slug=topic.slug)
        db.session.add(note)
        db.session.commit()
        return note

    @staticmethod
    def get_note_for_topic(topic_id: int) -> dict:
        topic = db.session.get(Topic, topic_id)
        if not topic:
            raise NotFoundError("Topic not found.")
        if not NoteService._is_leaf_topic(topic):
            raise ValidationError("Only topic-level nodes can have notes.")

        topic_chain = NoteService._topic_chain(topic)
        note = Note.query.filter_by(topic_id=topic.id).first()
        versions_map: dict[str, dict] = {}

        if note:
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
                "level": getattr(topic.level, "value", topic.level),
                "breadcrumb": " > ".join(item.name for item in topic_chain),
            },
            "note": {
                "id": note.id,
                "topic_id": note.topic_id,
                "title": note.title,
                "slug": note.slug,
            } if note else None,
            "versions": versions_map,
        }

    @staticmethod
    def get_all_notes() -> list[dict]:
        leaf_topics = Topic.query.filter(~Topic.children.any()).order_by(Topic.name.asc()).all()
        topic_ids = [topic.id for topic in leaf_topics]
        notes = Note.query.filter(Note.topic_id.in_(topic_ids)).all() if topic_ids else []
        notes_by_topic_id = {note.topic_id: note for note in notes}
        return [NoteService._serialize_leaf_topic(topic, notes_by_topic_id.get(topic.id)) for topic in leaf_topics]

    @staticmethod
    def get_note_with_versions(slug: str) -> dict:
        note = Note.query.filter_by(slug=slug).first()
        if not note:
            topic = Topic.query.filter_by(slug=slug).first()
            if topic and NoteService._is_leaf_topic(topic):
                note = Note.query.filter_by(topic_id=topic.id).first()

        if not note:
            demo_note = DEMO_NOTES.get(slug)
            if demo_note:
                return demo_note
            raise NotFoundError("Note not found.")

        versions = (
            NoteVersion.query.filter_by(note_id=note.id)
            .order_by(NoteVersion.version_type.asc())
            .all()
        )
        versions_map = {v.version_type.value: v.content for v in versions}
        topic_chain = NoteService._topic_chain(note.topic)
        topic_path = " / ".join(item.name for item in topic_chain[:-1]) if len(topic_chain) > 1 else note.topic.name

        return {
            "id": note.id,
            "slug": note.slug,
            "title": note.title,
            "topic": topic_path,
            "label": " > ".join(item.name for item in topic_chain),
            "versions": versions_map,
        }

    @staticmethod
    def create_note(*, title: str, topic_slug: str | None, topic_id: int | None, slug: str | None) -> dict:
        topic = NoteService._get_leaf_topic_by_reference(topic_id=topic_id, topic_slug=topic_slug)

        existing = Note.query.filter_by(topic_id=topic.id).first()
        if existing:
            return {"id": existing.id, "topic_id": existing.topic_id, "title": existing.title, "slug": existing.slug}

        note_slug = slugify(slug or title)
        if Note.query.filter_by(slug=note_slug).first():
            raise ValidationError("A note with this slug already exists.", details={"slug": note_slug})

        note = Note(topic_id=topic.id, title=title, slug=note_slug)
        db.session.add(note)
        db.session.commit()

        return {"id": note.id, "topic_id": note.topic_id, "title": note.title, "slug": note.slug}
