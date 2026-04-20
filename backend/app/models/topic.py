import enum
from datetime import datetime

from app.utils.db import db


class TopicLevel(str, enum.Enum):
    TECHNOLOGY = "technology"
    MODULE = "module"
    TOPIC = "topic"


class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(140), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True, index=True)
    level = db.Column(db.Enum(TopicLevel, name="topic_level"), nullable=False, default=TopicLevel.TOPIC, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    parent = db.relationship("Topic", remote_side=[id], backref=db.backref("children", lazy="dynamic"))
