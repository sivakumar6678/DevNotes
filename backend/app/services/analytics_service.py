from flask import Request

from app.utils.db import db
from app.models import AnalyticsEvent, EventType, Topic
from app.services.version_service import VersionService
from app.utils.errors import NotFoundError


class AnalyticsService:
    @staticmethod
    def _get_client_ip(request: Request) -> str | None:
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip() or None
        return request.remote_addr

    @staticmethod
    def track_event(
        *,
        event_type: str,
        topic_id: int | None = None,
        topic_slug: str | None = None,
        version_type: str | None = None,
        session_id: str | None = None,
        metadata: dict | None = None,
        request: Request,
        user_id: int | None = None,
    ) -> dict:
        et = EventType(event_type) if event_type in {e.value for e in EventType} else EventType.PAGE_VIEW

        vt = None
        if version_type:
            try:
                vt = VersionService._parse_version_type(version_type)
            except Exception:
                vt = None

        resolved_topic_id = topic_id
        if resolved_topic_id is None and topic_slug:
            topic = Topic.query.filter_by(slug=topic_slug).first()
            if topic:
                resolved_topic_id = topic.id

        event = AnalyticsEvent(
            event_type=et,
            topic_id=resolved_topic_id,
            user_id=user_id,
            session_id=session_id,
            version_type=vt,
            event_metadata=metadata or {},
            user_ip=AnalyticsService._get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
        )
        db.session.add(event)
        db.session.commit()

        return {
            "id": event.id,
            "event_type": event.event_type.value,
            "topic_id": event.topic_id,
            "version_type": event.version_type.value if event.version_type else None,
            "created_at": event.created_at.isoformat(),
        }

    @staticmethod
    def track_view(*, topic_slug: str | None, topic_id: int | None, version_type: str, request: Request) -> dict:
        """Backward-compatible view tracking — maps to a VERSION_CLICK event."""
        return AnalyticsService.track_event(
            event_type=EventType.VERSION_CLICK.value,
            topic_id=topic_id,
            topic_slug=topic_slug,
            version_type=version_type,
            request=request,
        )
