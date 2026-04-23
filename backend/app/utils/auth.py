from flask_jwt_extended import get_jwt_identity

from app.models.user import User
from app.utils.db import db
from app.utils.errors import AuthenticationError, AuthorizationError


def get_current_user() -> User:
    identity = get_jwt_identity()
    if identity is None:
        raise AuthenticationError("Authentication required.")

    user = db.session.get(User, int(identity))
    if not user:
        raise AuthenticationError("Authentication required.")

    return user


def require_admin_user() -> User:
    """Require super_admin role."""
    user = get_current_user()
    if user.role != "super_admin":
        raise AuthorizationError("Admin access required.")
    return user


def require_contributor_or_admin() -> User:
    """Allow contributor or super_admin."""
    user = get_current_user()
    if user.role not in ("super_admin", "contributor"):
        raise AuthorizationError("Contributor access required.")
    return user
