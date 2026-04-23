from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.technology_service import TechnologyService
from app.utils.auth import require_admin_user


def list_technologies():
    """Public: returns published technologies. Admins see all."""
    from app.utils.db import db
    from app.models.user import User
    from flask_jwt_extended import verify_jwt_in_request, exceptions as jwt_exceptions
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            user = db.session.get(User, int(identity))
            if user and user.role == "super_admin":
                technologies = TechnologyService.list_technologies(published_only=False)
                return jsonify({"status": "success", "data": technologies})
    except Exception:
        pass

    technologies = TechnologyService.list_technologies(published_only=False)
    return jsonify({"status": "success", "data": technologies})


@jwt_required()
def create_technology():
    require_admin_user()
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    slug = payload.get("slug")
    description = payload.get("description")
    icon_url = payload.get("icon_url")
    color = payload.get("color")
    sort_order = payload.get("sort_order", 0)

    if not name:
        return jsonify({"message": "Missing required field: name"}), 422

    from app.utils.errors import ValidationError
    from flask_jwt_extended import get_jwt_identity
    user_id = int(get_jwt_identity())

    technology = TechnologyService.create_technology(
        name=name,
        slug=slug,
        description=description,
        icon_url=icon_url,
        color=color,
        sort_order=sort_order,
        created_by=user_id,
    )
    return jsonify({"technology": technology}), 201


@jwt_required()
def update_technology(tech_id: int):
    require_admin_user()
    payload = request.get_json(silent=True) or {}
    technology = TechnologyService.update_technology(
        tech_id,
        name=payload.get("name"),
        description=payload.get("description"),
        icon_url=payload.get("icon_url"),
        color=payload.get("color"),
        is_published=payload.get("is_published"),
        sort_order=payload.get("sort_order"),
    )
    return jsonify({"technology": technology}), 200


@jwt_required()
def delete_technology(tech_id: int):
    require_admin_user()
    result = TechnologyService.delete_technology(tech_id)
    return jsonify(result), 200
