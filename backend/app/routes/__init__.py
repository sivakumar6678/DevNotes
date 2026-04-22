from flask import Blueprint

from .health_routes import health
from .analytics_routes import track_view
from .technologies_routes import list_technologies, create_technology
from .notes_routes import get_all_notes, get_note_by_slug, get_note_by_topic
from .topics_routes import (
    create_topic,
    delete_topic,
    get_curriculum,
    get_topics_tree,
    get_children,
    list_leaf_topics,
    list_topics,
    list_topics_by_technology,
    update_topic,
)
from .versions_routes import create_note_version_for_topic, upsert_note_version
from .auth_routes import login, signup, protected
from .users_routes import list_users, approve_user


api_bp = Blueprint("api", __name__, url_prefix="/api")

api_bp.add_url_rule("/health", view_func=health, methods=["GET"])
api_bp.add_url_rule("/technologies", view_func=list_technologies, methods=["GET"])
api_bp.add_url_rule("/technologies", view_func=create_technology, methods=["POST"])
api_bp.add_url_rule("/curriculum", view_func=get_curriculum, methods=["GET"])
api_bp.add_url_rule("/topics/tree", view_func=get_topics_tree, methods=["GET"])
api_bp.add_url_rule("/topics", view_func=list_topics, methods=["GET"])
api_bp.add_url_rule("/topics", view_func=create_topic, methods=["POST"])
api_bp.add_url_rule("/topics/leaf", view_func=list_leaf_topics, methods=["GET"])
api_bp.add_url_rule("/topics/<int:topic_id>", view_func=update_topic, methods=["PUT"])
api_bp.add_url_rule("/topics/<int:topic_id>", view_func=delete_topic, methods=["DELETE"])
api_bp.add_url_rule("/topics/<int:parent_id>/children", view_func=get_children, methods=["GET"])
api_bp.add_url_rule("/topics/technology/<int:technology_id>", view_func=list_topics_by_technology, methods=["GET"])
api_bp.add_url_rule("/topics/<int:topic_id>/note", view_func=get_note_by_topic, methods=["GET"])
api_bp.add_url_rule("/topics/<int:topic_id>/note-version", view_func=create_note_version_for_topic, methods=["POST"])
api_bp.add_url_rule("/notes/<string:slug>", view_func=get_note_by_slug, methods=["GET"])
api_bp.add_url_rule("/notes", view_func=get_all_notes, methods=["GET"])
api_bp.add_url_rule("/note-version", view_func=upsert_note_version, methods=["POST"])
api_bp.add_url_rule("/auth/signup", view_func=signup, methods=["POST"])
api_bp.add_url_rule("/auth/login", view_func=login, methods=["POST"])
api_bp.add_url_rule("/auth/protected", view_func=protected, methods=["GET"])
api_bp.add_url_rule("/users", view_func=list_users, methods=["GET"])
api_bp.add_url_rule("/users/approve/<int:user_id>", view_func=approve_user, methods=["POST"])
api_bp.add_url_rule("/track-view", view_func=track_view, methods=["POST"])
