from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, inspect, text

from app.models import NoteView, NoteVersion, Topic, TopicLevel
from app.utils.db import db
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify



class TopicService:
    def ensure_topic_schema() -> None:
        inspector = inspect(db.engine)
        if "topics" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("topics")}

        if "level" not in columns:
            db.session.execute(text("ALTER TABLE topics ADD COLUMN level VARCHAR(20)"))
            db.session.commit()

        if "created_at" not in columns:
            db.session.execute(text("ALTER TABLE topics ADD COLUMN created_at TIMESTAMP"))
            db.session.commit()

        TopicService._backfill_topic_metadata()

    @staticmethod
    def _backfill_topic_metadata() -> None:
        topics = Topic.query.order_by(Topic.id.asc()).all()
        changed = False
        now = datetime.utcnow()

        for topic in topics:
            expected_level = TopicService._expected_level_for_topic(topic)
            if topic.level != expected_level:
                topic.level = expected_level
                changed = True
            if topic.created_at is None:
                topic.created_at = now
                changed = True

        if changed:
            db.session.commit()

    @staticmethod
    def _expected_level_for_topic(topic: Topic) -> TopicLevel:
        depth = 0
        current = topic.parent
        while current is not None:
            depth += 1
            current = current.parent

        if depth <= 0:
            return TopicLevel.TECHNOLOGY
        if depth == 1:
            return TopicLevel.MODULE
        return TopicLevel.TOPIC

    @staticmethod
    def _serialize_tree_node(topic: Topic) -> dict:
        children = topic.children.order_by(Topic.name.asc()).all()
        return {
            "id": topic.id,
            "name": topic.name,
            "slug": topic.slug,
            "parent_id": topic.parent_id,
            "level": topic.level.value if isinstance(topic.level, TopicLevel) else str(topic.level),
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
            "level": topic.level.value if isinstance(topic.level, TopicLevel) else str(topic.level),
            "created_at": topic.created_at.isoformat() if topic.created_at else None,
        }

    @staticmethod
    def get_curriculum_tree() -> list[dict]:
        technologies = (
            Topic.query.filter_by(level=TopicLevel.TECHNOLOGY)
            .order_by(Topic.name.asc())
            .all()
        )
        return [TopicService._serialize_tree_node(topic) for topic in technologies]

    @staticmethod
    def list_topics() -> list[dict]:
        topics = Topic.query.order_by(Topic.created_at.asc(), Topic.name.asc()).all()
        return [TopicService._serialize_flat_topic(topic) for topic in topics]

    @staticmethod
    def list_leaf_topics() -> list[dict]:
        topics = (
            Topic.query.filter_by(level=TopicLevel.TOPIC)
            .order_by(Topic.name.asc())
            .all()
        )
        return [TopicService._serialize_flat_topic(topic) for topic in topics]

    @staticmethod
    def list_technologies() -> list[dict]:
        technologies = (
            Topic.query.filter_by(level=TopicLevel.TECHNOLOGY)
            .order_by(Topic.name.asc())
            .all()
        )
        return [{"id": topic.id, "name": topic.name, "slug": topic.slug} for topic in technologies]

    @staticmethod
    def list_topics_by_technology(tech_slug: str) -> list[dict]:
        technology = Topic.query.filter_by(slug=tech_slug, level=TopicLevel.TECHNOLOGY).first()
        if technology:
            return [TopicService._serialize_tree_node(child) for child in technology.children.order_by(Topic.name.asc()).all()]

        raise NotFoundError("Technology not found.")

    @staticmethod
    def _parse_level(level: str) -> TopicLevel:
        try:
            return TopicLevel(level)
        except Exception as exc:
            raise ValidationError(
                "Invalid `level`.",
                details={"allowed": [item.value for item in TopicLevel]},
            ) from exc

    @staticmethod
    def _required_child_level(parent: Topic | None) -> TopicLevel:
        if parent is None:
            return TopicLevel.TECHNOLOGY
        if parent.level == TopicLevel.TECHNOLOGY:
            return TopicLevel.MODULE
        if parent.level == TopicLevel.MODULE:
            return TopicLevel.TOPIC
        raise ValidationError("Topics cannot have children.")

    @staticmethod
    def _validate_parent_for_level(level: TopicLevel, parent: Topic | None) -> None:
        expected = TopicService._required_child_level(parent)
        if level != expected:
            raise ValidationError(
                "Invalid hierarchy for `level` and `parent_id`.",
                details={"expected_level": expected.value},
            )

    @staticmethod
    def _ensure_unique_name_under_parent(name: str, parent_id: int | None, exclude_id: int | None = None) -> None:
        query = Topic.query.filter(func.lower(Topic.name) == name.strip().lower())
        if parent_id is None:
            query = query.filter(Topic.parent_id.is_(None))
        else:
            query = query.filter_by(parent_id=parent_id)
        if exclude_id is not None:
            query = query.filter(Topic.id != exclude_id)

        if query.first():
            raise ValidationError("A node with this name already exists under the selected parent.")

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
    def create_topic(*, name: str, parent_id: int | None, level: str) -> dict:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValidationError("`name` is required.")

        parent = TopicService._get_topic(parent_id) if parent_id is not None else None
        parsed_level = TopicService._parse_level(level)
        TopicService._validate_parent_for_level(parsed_level, parent)
        TopicService._ensure_unique_name_under_parent(normalized_name, parent_id)

        topic = Topic(
            name=normalized_name,
            slug=TopicService._build_unique_slug(normalized_name),
            parent_id=parent_id,
            level=parsed_level,
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
            TopicService._validate_parent_for_level(topic.level, new_parent)

        new_name = topic.name if name is None else name.strip()
        if not new_name:
            raise ValidationError("`name` cannot be empty.")

        target_parent_id = new_parent.id if new_parent else None
        TopicService._ensure_unique_name_under_parent(new_name, target_parent_id, exclude_id=topic.id)

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
