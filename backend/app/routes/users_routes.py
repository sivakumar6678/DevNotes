from flask import jsonify
from flask_jwt_extended import jwt_required

from app.services.auth_service import AuthService
from app.utils.auth import require_admin_user


@jwt_required()
def list_users():
    require_admin_user()
    return jsonify({"users": AuthService.list_users()}), 200


@jwt_required()
def approve_user(user_id: int):
    require_admin_user()
    user = AuthService.approve_user(user_id)
    return jsonify({"message": "User approved successfully.", "user": user}), 200


@jwt_required()
def reject_user(user_id: int):
    require_admin_user()
    user = AuthService.reject_user(user_id)
    return jsonify({"message": "User rejected successfully.", "user": user}), 200
