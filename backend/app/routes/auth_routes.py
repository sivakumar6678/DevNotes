from flask import jsonify, request
from flask_jwt_extended import create_access_token, jwt_required

from app.services.auth_service import AuthService
from app.utils.errors import ValidationError


def signup():
    payload = request.get_json(silent=True) or {}
    print("[auth] signup payload:", payload)

    name = payload.get("name")
    email = payload.get("email")
    password = payload.get("password")

    if not name or not email or not password:
        raise ValidationError("`name`, `email`, and `password` are required.")

    user = AuthService.signup(name=name, email=email, password=password)
    token = create_access_token(identity=user["id"])
    print(f"[auth] user created: {user['email']} (id={user['id']})")
    return jsonify({"user": user, "token": token}), 201


def login():
    payload = request.get_json(silent=True) or {}
    print("[auth] login payload:", payload)

    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise ValidationError("`email` and `password` are required.")

    user = AuthService.login(email=email, password=password)
    token = create_access_token(identity=user["id"])
    print(f"[auth] login success for: {user['email']} (id={user['id']})")
    return jsonify({"user": user, "token": token}), 200


@jwt_required()
def protected():
    return jsonify({"message": "You are authenticated!"}), 200