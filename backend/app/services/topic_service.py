from __future__ import annotations

from datetime import datetime

from sqlalchemy import func

from app.models import NoteView, NoteVersion, Topic, Technology
from app.utils.db import db
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify


class TopicService:
    @staticmethod
    def ensure_topic_schema() -> None:
        pass

    @staticmethod
    def _serialize_tree_node(topic: Topic) -> dict:
        children = topic.children.order_by(Topic.name.asc()).all()
        return {
            "id": topic.id,
            "name": topic.name,
            "slug": topic.slug,
            "parent_id": topic.parent_id,
            "technology_id": topic.technology_id,
            "type": "module" if topic.parent_id is None else "topic",
            "created_at": topic.created_at.isoformat() if topic.created_at else None,
            "children": [TopicService._serialize_tree_node(child) for child in children],
        }

    @staticmethod
    def _serialize_flat_topic(topic: Topic) -> dict:
        return {
            "id": topic.id,
            "name": topic.name,
            "slug": topic.slug,
            "parent_id": topic.parent_id,
            "technology_id": topic.technology_id,
            "type": "module" if topic.parent_id is None else "topic",
            "created_at": topic.created_at.isoformat() if topic.created_at else None,
        }

    @staticmethod
    def list_topics(technology_id: int | None = None, parent_id: int | None = None, filter_parent: bool = False) -> list[dict]:
        query = Topic.query
        
        if technology_id is not None:
            query = query.filter_by(technology_id=technology_id)
                
        if filter_parent:
            query = query.filter_by(parent_id=parent_id)
        
        topics = query.order_by(Topic.created_at.asc(), Topic.name.asc()).all()
        return [TopicService._serialize_flat_topic(topic) for topic in topics]

    @staticmethod
    def list_leaf_topics() -> list[dict]:
        topics = (
            Topic.query.filter(Topic.parent_id.isnot(None))
            .order_by(Topic.name.asc())
            .all()
        )
        return [TopicService._serialize_flat_topic(topic) for topic in topics]

    @staticmethod
    def list_topics_by_technology(technology_id: int) -> list[dict]:
        modules = Topic.query.filter_by(technology_id=technology_id, parent_id=None).order_by(Topic.name.asc()).all()
        return [TopicService._serialize_tree_node(child) for child in modules]

    @staticmethod
    def _validate_parent_for_technology(parent: Topic | None, technology_id: int) -> None:
        if parent is not None:
            if parent.technology_id != technology_id:
                raise ValidationError("Parent topic belongs to a different technology.")
            if parent.parent_id is not None:
                raise ValidationError("Topics cannot have children.")

    @staticmethod
    def _ensure_unique_name_under_parent(name: str, technology_id: int, parent_id: int | None, exclude_id: int | None = None) -> None:
        query = Topic.query.filter(func.lower(Topic.name) == name.strip().lower(), Topic.technology_id == technology_id)
        if parent_id is None:
            query = query.filter(Topic.parent_id.is_(None))
        else:
            query = query.filter_by(parent_id=parent_id)
        if exclude_id is not None:
            query = query.filter(Topic.id != exclude_id)

        if query.first():
            raise ValidationError("A node with this name already exists under the selected parent/technology.")

    @staticmethod
    def _build_unique_slug(name: str, exclude_id: int | None = None) -> str:
        base_slug = slugify(name)
        candidate = base_slug
        counter = 2

        while True:
            query = Topic.query.filter_by(slug=candidate)
            if exclude_id is not None:
                query = query.filter(Topic.id != exclude_id)
            if not query.first():
                return candidate
            candidate = f"{base_slug}-{counter}"
            counter += 1

    @staticmethod
    def _get_topic(topic_id: int) -> Topic:
        topic = db.session.get(Topic, topic_id)
        if not topic:
            raise NotFoundError("Topic not found.")
        return topic

    @staticmethod
    def _collect_descendant_ids(topic: Topic) -> list[int]:
        descendant_ids = [topic.id]
        for child in topic.children.order_by(Topic.id.asc()).all():
            descendant_ids.extend(TopicService._collect_descendant_ids(child))
        return descendant_ids

    @staticmethod
    def create_topic(*, name: str, slug: str, technology_id: int, parent_id: int | None) -> dict:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValidationError("`name` is required.")

        tech = db.session.get(Technology, technology_id)
        if not tech:
            raise ValidationError("Technology not found.")

        parent = TopicService._get_topic(parent_id) if parent_id is not None else None
        TopicService._validate_parent_for_technology(parent, technology_id)
        TopicService._ensure_unique_name_under_parent(normalized_name, technology_id, parent_id)

        topic = Topic(
            name=normalized_name,
            slug=slug,
            technology_id=technology_id,
            parent_id=parent_id,
        )
        db.session.add(topic)
        db.session.commit()

        return TopicService._serialize_flat_topic(topic)

    @staticmethod
    def update_topic(*, topic_id: int, name: str | None, parent_id: int | None, parent_id_provided: bool) -> dict:
        topic = TopicService._get_topic(topic_id)

        new_parent = topic.parent
        if parent_id_provided:
            new_parent = TopicService._get_topic(parent_id) if parent_id is not None else None
            if new_parent and new_parent.id == topic.id:
                raise ValidationError("A node cannot be its own parent.")
            if new_parent and new_parent.id in TopicService._collect_descendant_ids(topic):
                raise ValidationError("A node cannot be moved under one of its descendants.")
            TopicService._validate_parent_for_technology(new_parent, topic.technology_id)

        new_name = topic.name if name is None else name.strip()
        if not new_name:
            raise ValidationError("`name` cannot be empty.")

        target_parent_id = new_parent.id if new_parent else None
        TopicService._ensure_unique_name_under_parent(new_name, topic.technology_id, target_parent_id, exclude_id=topic.id)

        topic.name = new_name
        topic.parent_id = target_parent_id
        topic.slug = TopicService._build_unique_slug(new_name, exclude_id=topic.id)
        db.session.commit()

        return TopicService._serialize_flat_topic(topic)

    @staticmethod
    def delete_topic(topic_id: int) -> dict:
        topic = TopicService._get_topic(topic_id)
        topic_ids = TopicService._collect_descendant_ids(topic)

        NoteVersion.query.filter(NoteVersion.topic_id.in_(topic_ids)).delete(synchronize_session=False)
        NoteView.query.filter(NoteView.topic_id.in_(topic_ids)).delete(synchronize_session=False)
        Topic.query.filter(Topic.id.in_(topic_ids)).delete(synchronize_session=False)
        db.session.commit()

        return {"deleted_ids": topic_ids}
