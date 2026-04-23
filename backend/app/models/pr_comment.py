from datetime import datetime

from app.utils.db import db


class PRComment(db.Model):
    __tablename__ = "pr_comments"

    id = db.Column(db.Integer, primary_key=True)
    pr_id = db.Column(
        db.Integer, db.ForeignKey("pull_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    pull_request = db.relationship("PullRequest", back_populates="comments")
    author = db.relationship("User")
