from app.models import Note, Topic
from app.utils.errors import NotFoundError


DEMO_TECHNOLOGIES = [
    {"name": "JavaScript", "slug": "javascript"},
    {"name": "React", "slug": "react"},
    {"name": "Python", "slug": "python"},
    {"name": "MySQL", "slug": "mysql"},
]

DEMO_TOPICS = {
    "javascript": [
        {"name": "Closures", "slug": "closures"},
        {"name": "Promises", "slug": "promises"},
    ],
    "react": [
        {"name": "Components", "slug": "components"},
        {"name": "Hooks", "slug": "hooks"},
    ],
    "python": [
        {"name": "Decorators", "slug": "decorators"},
        {"name": "List Comprehensions", "slug": "list-comprehensions"},
    ],
    "mysql": [
        {"name": "Joins", "slug": "joins"},
        {"name": "Indexes", "slug": "indexes"},
    ],
}


class TopicService:
    @staticmethod
    def list_topics() -> list[dict]:
        topics = Topic.query.order_by(Topic.parent_id.asc(), Topic.name.asc()).all()
        return [
            {
                "id": t.id,
                "name": t.name,
                "slug": t.slug,
                "description": t.description,
                "parent_id": t.parent_id,
            }
            for t in topics
        ]

    @staticmethod
    def list_technologies() -> list[dict]:
        technologies = Topic.query.filter_by(parent_id=None).order_by(Topic.name.asc()).all()
        if technologies:
            return [{"name": technology.name, "slug": technology.slug} for technology in technologies]

        return DEMO_TECHNOLOGIES

    @staticmethod
    def list_topics_by_technology(tech_slug: str) -> list[dict]:
        technology = Topic.query.filter_by(slug=tech_slug, parent_id=None).first()
        technology_exists_in_demo = tech_slug in DEMO_TOPICS

        note_rows: list[Note] = []
        if technology:
            direct_notes = (
                Note.query.join(Topic)
                .filter(Topic.slug == tech_slug)
                .order_by(Note.title.asc())
                .all()
            )
            child_notes = (
                Note.query.join(Topic)
                .filter(Topic.parent_id == technology.id)
                .order_by(Note.title.asc())
                .all()
            )

            seen = set()
            for note in [*direct_notes, *child_notes]:
                if note.slug not in seen:
                    seen.add(note.slug)
                    note_rows.append(note)

        if note_rows:
            return [{"name": note.title, "slug": note.slug} for note in note_rows]

        if technology_exists_in_demo:
            return DEMO_TOPICS[tech_slug]

        raise NotFoundError("Technology not found.")
