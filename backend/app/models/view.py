from datetime import datetime, timezone

from app.utils.db import db
from app.models.note_version import VersionType


class NoteView(db.Model):
    __tablename__ = "note_views"

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=False, index=True)
    version_type = db.Column(db.Enum(VersionType, name="version_type"), nullable=False, index=True)
    viewed_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    user_ip = db.Column(db.String(64), nullable=True, index=True)

    topic = db.relationship("Topic", backref=db.backref("views", lazy="dynamic", cascade="all, delete-orphan"))
