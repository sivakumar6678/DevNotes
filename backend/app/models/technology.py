from datetime import datetime
from app.utils.db import db

class Technology(db.Model):
    __tablename__ = "technologies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(140), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    topics = db.relationship("Topic", backref="technology", lazy="dynamic", cascade="all, delete-orphan")
