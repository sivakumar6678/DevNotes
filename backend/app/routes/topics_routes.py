from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.services.topic_service import TopicService
from app.utils.auth import require_admin_user


def get_curriculum():
    return jsonify(TopicService.get_curriculum_tree())


def get_topics_tree():
    return jsonify(TopicService.get_curriculum_tree())


def list_topics():
    topics = TopicService.list_topics()
    return jsonify({"topics": topics})


def list_topics_by_technology(tech_slug: str):
    topics = TopicService.list_topics_by_technology(tech_slug)
    return jsonify(topics)


def list_leaf_topics():
    return jsonify({"topics": TopicService.list_leaf_topics()})


@jwt_required()
def create_topic():
    require_admin_user()
    payload = request.get_json(silent=True) or {}

    topic = TopicService.create_topic(
        name=payload.get("name", ""),
        parent_id=payload.get("parent_id"),
        level=payload.get("level", ""),
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
    )
    return jsonify({"topic": topic}), 200


@jwt_required()
def delete_topic(topic_id: int):
    require_admin_user()
    result = TopicService.delete_topic(topic_id)
    return jsonify(result), 200
