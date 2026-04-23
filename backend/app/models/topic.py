from datetime import datetime

from sqlalchemy import UniqueConstraint

from app.utils.db import db


class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    technology_id = db.Column(
        db.Integer, db.ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id = db.Column(
        db.Integer, db.ForeignKey("topics.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(240), nullable=False)
    description = db.Column(db.Text, nullable=True)
    # section = top-level group, topic = mid-level, subtopic = leaf (holds notes)
    node_type = db.Column(db.String(20), nullable=False, default="topic")
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    is_published = db.Column(db.Boolean, nullable=False, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    parent = db.relationship("Topic", remote_side=[id], backref=db.backref("children", lazy="dynamic"))
    creator = db.relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        UniqueConstraint("technology_id", "slug", name="uq_topic_tech_slug"),
    )
