import enum
from datetime import datetime, timezone

from app.utils.db import db
from app.models.note_version import VersionType


class EventType(str, enum.Enum):
    PAGE_VIEW = "page_view"
    TOPIC_OPEN = "topic_open"
    VERSION_CLICK = "version_click"
    COMPARE_MODE = "compare_mode"
    BUTTON_CLICK = "button_click"
    SEARCH = "search"
    PR_SUBMIT = "pr_submit"


class AnalyticsEvent(db.Model):
    __tablename__ = "analytics_events"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    event_type = db.Column(
        db.Enum(EventType, name="event_type_enum"), nullable=False, index=True
    )
    topic_id = db.Column(
        db.Integer, db.ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    session_id = db.Column(db.String(64), nullable=True)
    version_type = db.Column(
        db.Enum(VersionType, name="version_type_enum", create_type=False), nullable=True
    )
    # Flexible extra payload (GA event params, button labels, etc.)
    event_metadata = db.Column("metadata", db.JSON, nullable=False, default=dict)
    user_ip = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )

    topic = db.relationship("Topic", backref=db.backref("analytics_events", lazy="dynamic"))
    user = db.relationship("User")
