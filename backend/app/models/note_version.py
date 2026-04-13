import enum

from sqlalchemy import UniqueConstraint

from app.utils.db import db


class VersionType(str, enum.Enum):
    SIMPLE = "simple"
    PROFESSIONAL = "professional"
    INDUSTRY = "industry"
    INTERVIEW = "interview"


class NoteVersion(db.Model):
    __tablename__ = "note_versions"
    __table_args__ = (UniqueConstraint("note_id", "version_type", name="uq_note_version_type"),)

    id = db.Column(db.Integer, primary_key=True)
    note_id = db.Column(db.Integer, db.ForeignKey("notes.id"), nullable=False, index=True)
    version_type = db.Column(db.Enum(VersionType, name="version_type"), nullable=False, index=True)

    # Stored as JSON in Postgres (Supabase).
    content = db.Column(db.JSON, nullable=False)

    note = db.relationship("Note", backref=db.backref("versions", lazy="dynamic", cascade="all, delete-orphan"))
