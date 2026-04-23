from datetime import datetime

from app.utils.db import db


class Technology(db.Model):
    __tablename__ = "technologies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(140), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    icon_url = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), nullable=True)          # hex colour e.g. #F7DF1E
    is_published = db.Column(db.Boolean, nullable=False, default=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    topics = db.relationship("Topic", backref="technology", lazy="dynamic", cascade="all, delete-orphan")
    creator = db.relationship("User", foreign_keys=[created_by])
