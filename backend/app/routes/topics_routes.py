from flask import jsonify

from app.services.topic_service import TopicService


def list_topics():
    topics = TopicService.list_topics()
    return jsonify({"topics": topics})

