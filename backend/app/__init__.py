from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .config import get_config
from .extensions import migrate
from .routes import api_bp
from .services.auth_service import AuthService
from .services.note_service import NoteService
from .services.technology_service import TechnologyService
from .services.topic_service import TopicService
from .services.version_service import VersionService
from .utils.errors import APIError
from .utils.db import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config())

    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})

    app.register_blueprint(api_bp)

    with app.app_context():
        AuthService.ensure_user_schema()
        AuthService.ensure_admin_account()
        TechnologyService.ensure_technology_schema()
        TopicService.ensure_topic_schema()
        NoteService.ensure_note_schema()
        VersionService.ensure_note_version_schema()

    @app.errorhandler(APIError)
    def handle_api_error(err: APIError):
        return jsonify({"error": {"type": err.error_type, "message": err.message, "details": err.details}}), err.status_code

    @app.errorhandler(404)
    def handle_404(_):
        return jsonify({"error": {"type": "not_found", "message": "Resource not found"}}), 404

    @app.errorhandler(405)
    def handle_405(_):
        return jsonify({"error": {"type": "method_not_allowed", "message": "Method not allowed"}}), 405

    @app.errorhandler(500)
    def handle_500(_):
        return jsonify({"error": {"type": "internal_error", "message": "Internal server error"}}), 500

    return app
