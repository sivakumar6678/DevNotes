import enum
from datetime import datetime

from sqlalchemy import UniqueConstraint

from app.utils.db import db


class VersionType(str, enum.Enum):
    SIMPLE = "simple"
    INDUSTRY = "industry"
    INTERVIEW = "interview"
    REVISION = "revision"
    REALTIME = "realtime"
    THEORY = "theory"


class NoteVersion(db.Model):
    __tablename__ = "note_versions"

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(
        db.Integer, db.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_type = db.Column(
        db.Enum(VersionType, name="version_type_enum", create_type=False), nullable=False, index=True
    )
    # Full note content stored as JSONB
    content = db.Column(db.JSON, nullable=False, default=dict)
    is_published = db.Column(db.Boolean, nullable=False, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    topic = db.relationship(
        "Topic", backref=db.backref("versions", lazy="dynamic", cascade="all, delete-orphan")
    )
    author = db.relationship("User", foreign_keys=[created_by])
    editor = db.relationship("User", foreign_keys=[updated_by])

    __table_args__ = (UniqueConstraint("topic_id", "version_type", name="uq_note_version_type"),)
