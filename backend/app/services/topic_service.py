from app.models import Topic


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
