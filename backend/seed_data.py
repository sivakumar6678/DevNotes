from app import create_app
from app.utils.db import db
from app.models.topic import Topic


def main() -> None:
    app = create_app()
    with app.app_context():
        hierarchy = [
            {
                "name": "JavaScript",
                "slug": "javascript",
                "children": [
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
            },
            {
                "name": "React",
                "slug": "react",
                "children": [
                    {
                        "name": "Core",
                        "slug": "react-core",
                        "children": [
                            {"name": "Components", "slug": "components"},
                            {"name": "Hooks", "slug": "hooks"},
                        ],
                    },
                ],
            },
            {
                "name": "Python",
                "slug": "python",
                "children": [
                    {
                        "name": "Advanced",
                        "slug": "python-advanced",
                        "children": [
                            {"name": "Decorators", "slug": "decorators"},
                            {"name": "List Comprehensions", "slug": "list-comprehensions"},
                        ],
                    },
                ],
            },
        ]

        def upsert_topic(node: dict, parent_id: int | None = None) -> None:
            topic = Topic.query.filter_by(slug=node["slug"]).first()
            if not topic:
                topic = Topic(name=node["name"], slug=node["slug"])
                db.session.add(topic)

            topic.name = node["name"]
            topic.parent_id = parent_id
            topic.description = f"Notes about {node['name']}."
            db.session.flush()

            for child in node.get("children", []):
                upsert_topic(child, topic.id)

        for node in hierarchy:
            upsert_topic(node)

        db.session.commit()
        print("Hierarchy seeded successfully")


if __name__ == "__main__":
    main()
