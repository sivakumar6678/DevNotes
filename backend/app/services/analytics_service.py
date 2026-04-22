from flask import Request

from app.utils.db import db
from app.models import NoteView, Topic
from app.services.version_service import VersionService
from app.utils.errors import NotFoundError


class AnalyticsService:
    @staticmethod
    def _get_client_ip(request: Request) -> str | None:
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            # Use the first IP in the chain (client).
            return xff.split(",")[0].strip() or None
        return request.remote_addr

    @staticmethod
    def track_view(*, topic_slug: str | None, topic_id: int | None, version_type: str, request: Request) -> dict:
        vt = VersionService._parse_version_type(version_type)

        topic = None
        if topic_id is not None:
            topic = db.session.get(Topic, topic_id)
        elif topic_slug:
            topic = Topic.query.filter_by(slug=topic_slug).first()

        if not topic:
            raise NotFoundError("Topic not found.")

        view = NoteView(topic_id=topic.id, version_type=vt, user_ip=AnalyticsService._get_client_ip(request))
        db.session.add(view)
        db.session.commit()

        return {
            "id": view.id,
            "topic_id": view.topic_id,
            "version_type": view.version_type.value,
            "viewed_at": view.viewed_at.isoformat(),
            "user_ip": view.user_ip,
        }
