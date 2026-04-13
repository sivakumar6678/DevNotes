from flask import Blueprint

from .health_routes import health
from .analytics_routes import track_view
from .notes_routes import get_note_by_slug, create_note
from .topics_routes import list_topics
from .versions_routes import upsert_note_version


api_bp = Blueprint("api", __name__, url_prefix="/api")

api_bp.add_url_rule("/health", view_func=health, methods=["GET"])
api_bp.add_url_rule("/topics", view_func=list_topics, methods=["GET"])
api_bp.add_url_rule("/notes/<string:slug>", view_func=get_note_by_slug, methods=["GET"])
api_bp.add_url_rule("/notes", view_func=create_note, methods=["POST"])
api_bp.add_url_rule("/note-version", view_func=upsert_note_version, methods=["POST"])
api_bp.add_url_rule("/track-view", view_func=track_view, methods=["POST"])
