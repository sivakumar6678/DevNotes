from datetime import datetime

from sqlalchemy import UniqueConstraint

from app.utils.db import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    password = db.Column("password_hash", db.String(256), nullable=False)
    role = db.Column(
        db.String(30),
        nullable=False,
        default="public",
    )
    status = db.Column(db.String(30), nullable=False, default="pending")
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("email", name="uq_user_email"),)
