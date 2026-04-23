from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.models import Topic
from app.services.topic_service import TopicService
from app.utils.auth import require_admin_user


def get_curriculum():
    return jsonify(TopicService.get_curriculum_tree())


def get_topics_tree():
    return jsonify(TopicService.get_curriculum_tree())


def list_topics():
    technology_id_str = request.args.get("technology_id")
    parent_id_str = request.args.get("parent_id")
    filter_parent = "parent_id" in request.args
    
    technology_id = None
    if technology_id_str:
        try:
            technology_id = int(technology_id_str)
        except ValueError:
            pass

    parent_id = None
    if parent_id_str and parent_id_str.lower() != 'null':
        try:
            parent_id = int(parent_id_str)
        except ValueError:
            pass

    topics = TopicService.list_topics(technology_id=technology_id, parent_id=parent_id, filter_parent=filter_parent)
    return jsonify({"topics": topics})


def list_topics_by_technology(technology_id: int):
    topics = TopicService.list_topics_by_technology(technology_id)
    return jsonify(topics)


def get_children(parent_id: int):
    parent = TopicService._get_topic(parent_id)
    children = [TopicService._serialize_tree_node(child) for child in parent.children.order_by(Topic.name.asc()).all()]
    return jsonify(children)


def list_leaf_topics():
    return jsonify({"topics": TopicService.list_leaf_topics()})


@jwt_required()
def create_topic():
    require_admin_user()
    payload = request.get_json(silent=True) or {}
    
    name = payload.get("name")
    slug = payload.get("slug")
    technology_id = payload.get("technology_id")
    parent_id = payload.get("parent_id")
    node_type = payload.get("node_type", "topic")
    sort_order = payload.get("sort_order", 0)
    description = payload.get("description")

    if not name or not slug or not technology_id:
        return jsonify({"message": "Missing required fields: name, slug, technology_id are required"}), 422

    topic = TopicService.create_topic(
        name=name,
        slug=slug,
        technology_id=technology_id,
        parent_id=parent_id,
        node_type=node_type,
        sort_order=sort_order,
        description=description,
    )
    return jsonify({"topic": topic}), 201


@jwt_required()
def update_topic(topic_id: int):
    require_admin_user()
    payload = request.get_json(silent=True) or {}

    topic = TopicService.update_topic(
        topic_id=topic_id,
        name=payload.get("name"),
        parent_id=payload.get("parent_id"),
        parent_id_provided="parent_id" in payload,
        is_published=payload.get("is_published"),
        sort_order=payload.get("sort_order"),
    )
    return jsonify({"topic": topic}), 200


@jwt_required()
def delete_topic(topic_id: int):
    require_admin_user()
    result = TopicService.delete_topic(topic_id)
    return jsonify(result), 200
