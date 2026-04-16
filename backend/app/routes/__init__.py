from flask import Blueprint

from .health_routes import health
from .analytics_routes import track_view
from .technologies_routes import list_technologies
from .notes_routes import get_note_by_slug, create_note, get_all_notes
from .topics_routes import list_topics, list_topics_by_technology
from .versions_routes import upsert_note_version
from .auth_routes import login, signup, protected


api_bp = Blueprint("api", __name__, url_prefix="/api")

api_bp.add_url_rule("/health", view_func=health, methods=["GET"])
api_bp.add_url_rule("/technologies", view_func=list_technologies, methods=["GET"])
api_bp.add_url_rule("/topics", view_func=list_topics, methods=["GET"])
api_bp.add_url_rule("/topics/<string:tech_slug>", view_func=list_topics_by_technology, methods=["GET"])
api_bp.add_url_rule("/notes/<string:slug>", view_func=get_note_by_slug, methods=["GET"])
api_bp.add_url_rule("/notes", view_func=get_all_notes, methods=["GET"])
api_bp.add_url_rule("/notes", view_func=create_note, methods=["POST"])
api_bp.add_url_rule("/note-version", view_func=upsert_note_version, methods=["POST"])
api_bp.add_url_rule("/auth/signup", view_func=signup, methods=["POST"])
api_bp.add_url_rule("/auth/login", view_func=login, methods=["POST"])
api_bp.add_url_rule("/auth/protected", view_func=protected, methods=["GET"])
api_bp.add_url_rule("/track-view", view_func=track_view, methods=["POST"])
