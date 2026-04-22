from app.utils.db import db
from app.models import NoteVersion, Topic
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

        topic_chain = NoteService._topic_chain(topic)
        versions = (
            NoteVersion.query.filter_by(topic_id=topic.id)
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
                "id": topic.id,
                "topic_id": topic.id,
                "title": topic.name,
                "slug": topic.slug,
            },
            "versions": versions_map,
        }

    @staticmethod
    def get_all_notes() -> list[dict]:
        leaf_topics = Topic.query.filter(~Topic.children.any()).order_by(Topic.name.asc()).all()
        if not leaf_topics:
            return []

        topic_ids = [topic.id for topic in leaf_topics]
        versions = NoteVersion.query.filter(NoteVersion.topic_id.in_(topic_ids)).all()
        versions_by_topic_id = {}
        for version in versions:
            versions_by_topic_id.setdefault(version.topic_id, {})[version.version_type.value] = version.content

        return [
            {
                "id": topic.id,
                "topic_id": topic.id,
                "name": topic.name,
                "title": topic.name,
                "slug": topic.slug,
                "parent_id": topic.parent_id,
                "label": " > ".join(item.name for item in NoteService._topic_chain(topic)),
                "versions": versions_by_topic_id.get(topic.id, {}),
            }
            for topic in leaf_topics
        ]

    @staticmethod
    def get_note_with_versions(slug: str) -> dict:
        topic = Topic.query.filter_by(slug=slug).first()
        if not topic or not NoteService._is_leaf_topic(topic):
            demo_note = DEMO_NOTES.get(slug)
            if demo_note:
                return demo_note
            raise NotFoundError("Note not found.")

        versions = (
            NoteVersion.query.filter_by(topic_id=topic.id)
            .order_by(NoteVersion.version_type.asc())
            .all()
        )
        versions_map = {v.version_type.value: v.content for v in versions}
        topic_chain = NoteService._topic_chain(topic)
        topic_path = " / ".join(item.name for item in topic_chain[:-1]) if len(topic_chain) > 1 else topic.name

        return {
            "id": topic.id,
            "slug": topic.slug,
            "title": topic.name,
            "topic": topic_path,
            "label": " > ".join(item.name for item in topic_chain),
            "versions": versions_map,
        }

