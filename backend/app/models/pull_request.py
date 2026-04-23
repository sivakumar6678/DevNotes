import enum
from datetime import datetime

from app.utils.db import db
from app.models.note_version import VersionType


class PRStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    MERGED = "merged"


class PullRequest(db.Model):
    __tablename__ = "pull_requests"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(240), nullable=False)
    description = db.Column(db.Text, nullable=True)

    contributor_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewer_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    topic_id = db.Column(
        db.Integer, db.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_type = db.Column(
        db.Enum(VersionType, name="version_type_enum", create_type=False), nullable=False
    )
    # Snapshot of the content submitted (so edits after submission don't change it)
    content_snapshot = db.Column(db.JSON, nullable=False, default=dict)

    status = db.Column(
        db.Enum(PRStatus, name="pr_status_enum"), nullable=False, default=PRStatus.DRAFT, index=True
    )

    submitted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    contributor = db.relationship("User", foreign_keys=[contributor_id], backref="pull_requests")
    reviewer = db.relationship("User", foreign_keys=[reviewer_id])
    topic = db.relationship("Topic", backref=db.backref("pull_requests", lazy="dynamic"))
    comments = db.relationship("PRComment", back_populates="pull_request", cascade="all, delete-orphan")
