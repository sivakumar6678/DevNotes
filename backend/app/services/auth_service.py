import os

from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash

from app.models.user import User
from app.utils.db import db
from app.utils.errors import NotFoundError, ValidationError

VALID_ROLES = {"super_admin", "contributor", "public"}


class AuthService:
    @staticmethod
    def serialize_user(user: User) -> dict:
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "avatar_url": user.avatar_url,
        }

    @staticmethod
    def ensure_user_schema() -> None:
        """Run any incremental column migrations needed on the users table."""
        inspector = inspect(db.engine)
        if "users" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("users")}

        if "status" not in columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'pending'")
            )
            db.session.execute(text("UPDATE users SET status = 'approved' WHERE status IS NULL"))
            db.session.commit()

        if "avatar_url" not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT"))
            db.session.commit()

        # Migrate old 'admin' role to 'super_admin'
        db.session.execute(
            text("UPDATE users SET role = 'super_admin' WHERE role = 'admin'")
        )
        db.session.commit()

    @staticmethod
    def ensure_admin_account() -> None:
        inspector = inspect(db.engine)
        if "users" not in inspector.get_table_names():
            return

        admin_email = os.getenv("ADMIN_EMAIL", "admin@devnotes.local").strip().lower()
        admin_name = os.getenv("ADMIN_NAME", "Admin").strip() or "Admin"
        admin_password = os.getenv("ADMIN_PASSWORD", "admin12345")

        admin_user = User.query.filter_by(email=admin_email).first()
        if admin_user:
            changed = False
            if admin_user.role != "super_admin":
                admin_user.role = "super_admin"
                changed = True
            if admin_user.status != "approved":
                admin_user.status = "approved"
                changed = True
            if changed:
                db.session.commit()
            return

        user = User(
            name=admin_name,
            email=admin_email,
            password=generate_password_hash(admin_password),
            role="super_admin",
            status="approved",
        )
        db.session.add(user)
        db.session.commit()

    @staticmethod
    def signup(*, name: str, email: str, password: str) -> dict:
        normalized_email = email.strip().lower()
        normalized_name = name.strip()

        if User.query.filter_by(email=normalized_email).first():
            raise ValidationError("Email already exists.")

        password_hash = generate_password_hash(password)
        user = User(
            name=normalized_name,
            email=normalized_email,
            password=password_hash,
            role="public",
            status="pending",
        )
        db.session.add(user)
        db.session.commit()

        return AuthService.serialize_user(user)

    @staticmethod
    def login(*, email: str, password: str) -> dict:
        normalized_email = email.strip().lower()

        user = User.query.filter_by(email=normalized_email).first()
        if not user:
            raise ValidationError("User not found.")

        if not check_password_hash(user.password, password):
            raise ValidationError("Wrong password.")

        if user.status != "approved":
            raise ValidationError("Account not approved yet.")

        return AuthService.serialize_user(user)

    @staticmethod
    def get_user_by_id(user_id: int) -> User:
        user = db.session.get(User, user_id)
        if not user:
            raise NotFoundError("User not found.")
        return user

    @staticmethod
    def list_users() -> list[dict]:
        users = User.query.order_by(User.created_at.desc(), User.id.desc()).all()
        return [AuthService.serialize_user(user) for user in users]

    @staticmethod
    def approve_user(user_id: int) -> dict:
        user = AuthService.get_user_by_id(user_id)
        user.status = "approved"
        db.session.commit()
        return AuthService.serialize_user(user)

    @staticmethod
    def set_role(user_id: int, role: str) -> dict:
        if role not in VALID_ROLES:
            raise ValidationError(f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
        user = AuthService.get_user_by_id(user_id)
        user.role = role
        db.session.commit()
        return AuthService.serialize_user(user)
