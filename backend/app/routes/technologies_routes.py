from flask import jsonify

from app.services.topic_service import TopicService


def list_technologies():
    technologies = TopicService.list_technologies()
    return jsonify(technologies)
