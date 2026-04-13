from app.utils.db import db


class Topic(db.Model):
    __tablename__ = "topics"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(140), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)

    parent_id = db.Column(db.Integer, db.ForeignKey("topics.id"), nullable=True, index=True)
    parent = db.relationship("Topic", remote_side=[id], backref=db.backref("children", lazy="dynamic"))
