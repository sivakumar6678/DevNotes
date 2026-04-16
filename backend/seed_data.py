from app import create_app
from app.utils.db import db
from app.models.topic import Topic


def main() -> None:
    app = create_app()
    with app.app_context():
        # Technologies (parent_id = NULL)
        technologies = [
            {"name": "JavaScript", "slug": "javascript"},
            {"name": "React", "slug": "react"},
            {"name": "Python", "slug": "python"},
        ]

        for tech in technologies:
            existing = Topic.query.filter_by(slug=tech["slug"]).first()
            if not existing:
                topic = Topic(
                    name=tech["name"],
                    slug=tech["slug"],
                    description=f"Notes about {tech['name']} fundamentals.",
                    parent_id=None
                )
                db.session.add(topic)

        # Get JavaScript topic
        js_topic = Topic.query.filter_by(slug="javascript").first()
        if js_topic:
            # Topics (child of JavaScript)
            topics = [
                {"name": "Functions", "slug": "functions", "parent": None},
                {"name": "Async", "slug": "async", "parent": None},
                {"name": "Closures", "slug": "closures", "parent": "functions"},
                {"name": "Promises", "slug": "promises", "parent": "async"},
            ]

            child_topics = {}
            for topic_data in topics:
                existing = Topic.query.filter_by(slug=topic_data["slug"]).first()
                if existing:
                    child_topics[topic_data["slug"]] = existing
                    continue

                parent_slug = topic_data["parent"]
                parent_id = js_topic.id if parent_slug is None else None

                if parent_slug is not None:
                    parent = child_topics.get(parent_slug) or Topic.query.filter_by(slug=parent_slug).first()
                    parent_id = parent.id if parent else None

                topic = Topic(
                    name=topic_data["name"],
                    slug=topic_data["slug"],
                    description=f"Notes about {topic_data['name']} in JavaScript.",
                    parent_id=parent_id,
                )
                db.session.add(topic)
                child_topics[topic_data["slug"]] = topic

        db.session.commit()
        print("Sample data seeded successfully")


if __name__ == "__main__":
    main()