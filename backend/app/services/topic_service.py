from app.models import Topic
from app.utils.errors import NotFoundError


DEMO_TECHNOLOGIES = [
    {"name": "JavaScript", "slug": "javascript"},
    {"name": "React", "slug": "react"},
    {"name": "Python", "slug": "python"},
    {"name": "MySQL", "slug": "mysql"},
]

DEMO_TOPICS = {
    "javascript": [
        {
            "name": "Functions",
            "slug": "functions",
            "children": [
                {"name": "Closures", "slug": "closures"},
            ],
        },
        {
            "name": "Async",
            "slug": "async",
            "children": [
                {"name": "Promises", "slug": "promises"},
            ],
        },
    ],
    "react": [
        {
            "name": "Core",
            "slug": "react-core",
            "children": [
                {"name": "Components", "slug": "components"},
                {"name": "Hooks", "slug": "hooks"},
            ],
        },
    ],
    "python": [
        {
            "name": "Advanced",
            "slug": "python-advanced",
            "children": [
                {"name": "Decorators", "slug": "decorators"},
                {"name": "List Comprehensions", "slug": "list-comprehensions"},
            ],
        },
    ],
    "mysql": [
        {
            "name": "Querying",
            "slug": "mysql-querying",
            "children": [
                {"name": "Joins", "slug": "joins"},
                {"name": "Indexes", "slug": "indexes"},
            ],
        },
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
    def _serialize_topic(topic: Topic) -> dict:
        children = topic.children.order_by(Topic.name.asc()).all()
        serialized_children = [TopicService._serialize_topic(child) for child in children]

        result = {"name": topic.name, "slug": topic.slug}
        if serialized_children:
            result["children"] = serialized_children
        return result

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

        if technology:
            direct_children = technology.children.order_by(Topic.name.asc()).all()
            return [TopicService._serialize_topic(child) for child in direct_children]

        if technology_exists_in_demo:
            return DEMO_TOPICS[tech_slug]

        raise NotFoundError("Technology not found.")
