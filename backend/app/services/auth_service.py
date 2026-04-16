from werkzeug.security import check_password_hash, generate_password_hash

from app.models.user import User
from app.utils.db import db
from app.utils.errors import ValidationError


class AuthService:
    @staticmethod
    def signup(*, name: str, email: str, password: str) -> dict:
        normalized_email = email.strip().lower()
        normalized_name = name.strip()
        print(f"[auth-service] signup attempt: {normalized_email}")

        if User.query.filter_by(email=normalized_email).first():
            raise ValidationError("Email already exists.")

        password_hash = generate_password_hash(password)
        user = User(name=normalized_name, email=normalized_email, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()

        print(f"[auth-service] signup success: {normalized_email}")
        return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

    @staticmethod
    def login(*, email: str, password: str) -> dict:
        normalized_email = email.strip().lower()
        print(f"[auth-service] login attempt: {normalized_email}")

        user = User.query.filter_by(email=normalized_email).first()
        if not user:
            raise ValidationError("User not found.")

        if not check_password_hash(user.password_hash, password):
            raise ValidationError("Wrong password.")

        return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}