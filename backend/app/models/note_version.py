import enum

from sqlalchemy import UniqueConstraint

from app.models.topic import Topic
from app.utils.db import db


class VersionType(str, enum.Enum):
    SIMPLE = "simple"
    PROFESSIONAL = "professional"
    INDUSTRY = "industry"
    INTERVIEW = "interview"


class NoteVersion(db.Model):
    __tablename__ = "note_versions"
    __table_args__ = (UniqueConstraint("topic_id", "version_type", name="uq_note_version_type"),)

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=False, index=True)
    version_type = db.Column(db.Enum(VersionType, name="version_type"), nullable=False, index=True)

    # Stored as JSON in Postgres (Supabase).
    content = db.Column(db.JSON, nullable=False)

    topic = db.relationship("Topic", backref=db.backref("versions", lazy="dynamic", cascade="all, delete-orphan"))
