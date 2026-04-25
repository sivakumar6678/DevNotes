from __future__ import annotations

from datetime import datetime

from sqlalchemy import func

from app.models import NoteVersion, Topic, Technology
from app.utils.db import db
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify


class TopicService:
    @staticmethod
    def get_curriculum_tree() -> list[dict]:
        technologies = Technology.query.order_by(Technology.name.asc()).all()
        result = []
        for tech in technologies:
            modules = Topic.query.filter_by(technology_id=tech.id, parent_id=None).order_by(Topic.sort_order.asc(), Topic.created_at.asc()).all()
            tech_node = {
                "id": tech.id,
                "name": tech.name,
                "slug": tech.slug,
                "technology_id": tech.id,
                "parent_id": None,
                "type": "technology",
                "created_at": None,
                "children": [TopicService._serialize_tree_node(m) for m in modules]
            }
            result.append(tech_node)
        return result

    @staticmethod
    def ensure_topic_schema() -> None:
        """Add new columns to topics table if they don't exist (incremental migration)."""
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        if "topics" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("topics")}
        migrations = []

        # ── Critical: technology_id was added after initial table creation ────
        if "technology_id" not in columns:
            migrations.append(
                "ALTER TABLE topics ADD COLUMN IF NOT EXISTS technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE"
            )

        if "node_type" not in columns:
            migrations.append("ALTER TABLE topics ADD COLUMN IF NOT EXISTS node_type VARCHAR(20) NOT NULL DEFAULT 'topic'")
        if "sort_order" not in columns:
            migrations.append("ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0")
        if "is_published" not in columns:
            migrations.append("ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE")
        if "created_by" not in columns:
            migrations.append("ALTER TABLE topics ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "updated_at" not in columns:
            migrations.append("ALTER TABLE topics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
        if "description" not in columns:
            migrations.append("ALTER TABLE topics ADD COLUMN IF NOT EXISTS description TEXT")

        for sql in migrations:
            db.session.execute(text(sql))

        if migrations:
            db.session.commit()
            print(f"[topics] Applied {len(migrations)} schema migration(s).")

        # ── Backfill technology_id NULLs with first available technology ──────
        # Needed for any rows that existed before the technology_id column was added.
        try:
            first_tech = db.session.execute(
                text("SELECT id FROM technologies ORDER BY id ASC LIMIT 1")
            ).fetchone()
            if first_tech:
                updated = db.session.execute(
                    text("UPDATE topics SET technology_id = :tid WHERE technology_id IS NULL"),
                    {"tid": first_tech[0]},
                )
                if updated.rowcount:
                    db.session.commit()
                    print(f"[topics] Backfilled {updated.rowcount} row(s) with technology_id={first_tech[0]}.")
        except Exception as exc:
            db.session.rollback()
            print(f"[topics] Backfill skipped: {exc}")

        # ── Unique constraint on (technology_id, slug) ────────────────────────
        try:
            constraint_names = {c["name"] for c in inspector.get_unique_constraints("topics")}
            if "uq_topic_tech_slug" not in constraint_names:
                db.session.execute(
                    text("ALTER TABLE topics ADD CONSTRAINT uq_topic_tech_slug UNIQUE (technology_id, slug)")
                )
                db.session.commit()
                print("[topics] Added unique constraint uq_topic_tech_slug.")
        except Exception as exc:
            db.session.rollback()
            print(f"[topics] Constraint migration skipped (may already exist): {exc}")


    @staticmethod
    def _serialize_tree_node(topic: Topic) -> dict:
        children = topic.children.order_by(Topic.sort_order.asc(), Topic.created_at.asc()).all()
        return {
            "id": topic.id,
            "name": topic.name,
            "slug": topic.slug,
            "parent_id": topic.parent_id,
            "technology_id": topic.technology_id,
            "node_type": topic.node_type,
            "sort_order": topic.sort_order,
            "is_published": topic.is_published,
            "type": topic.node_type,
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
            "node_type": topic.node_type,
            "sort_order": topic.sort_order,
            "is_published": topic.is_published,
            "type": topic.node_type,
            "created_at": topic.created_at.isoformat() if topic.created_at else None,
        }

    @staticmethod
    def list_topics(technology_id: int | None = None, parent_id: int | None = None, filter_parent: bool = False) -> list[dict]:
        query = Topic.query
        
        if technology_id is not None:
            query = query.filter_by(technology_id=technology_id)
                
        if filter_parent:
            query = query.filter_by(parent_id=parent_id)
        
        topics = query.order_by(Topic.sort_order.asc(), Topic.created_at.asc()).all()
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
        modules = Topic.query.filter_by(technology_id=technology_id, parent_id=None).order_by(Topic.sort_order.asc(), Topic.created_at.asc()).all()
        return [TopicService._serialize_tree_node(child) for child in modules]

    @staticmethod
    def _validate_parent_for_technology(parent: Topic | None, technology_id: int) -> None:
        if parent is not None:
            if parent.technology_id != technology_id:
                raise ValidationError("Parent topic belongs to a different technology.")

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
    def create_topic(
        *,
        name: str,
        slug: str,
        technology_id: int,
        parent_id: int | None,
        node_type: str = "topic",
        sort_order: int = 0,
        description: str | None = None,
    ) -> dict:
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
            node_type=node_type,
            sort_order=sort_order,
            description=description,
        )
        db.session.add(topic)
        db.session.commit()

        return TopicService._serialize_flat_topic(topic)

    @staticmethod
    def update_topic(
        *,
        topic_id: int,
        name: str | None,
        parent_id: int | None,
        parent_id_provided: bool,
        is_published: bool | None = None,
        sort_order: int | None = None,
    ) -> dict:
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

        if is_published is not None:
            topic.is_published = is_published
        if sort_order is not None:
            topic.sort_order = sort_order

        db.session.commit()

        return TopicService._serialize_flat_topic(topic)

    @staticmethod
    def delete_topic(topic_id: int) -> dict:
        from app.models import Note
        topic = TopicService._get_topic(topic_id)
        topic_ids = TopicService._collect_descendant_ids(topic)

        # note_versions link to notes, which link to topics
        notes = Note.query.filter(Note.topic_id.in_(topic_ids)).all()
        note_ids = [n.id for n in notes]

        if note_ids:
            NoteVersion.query.filter(NoteVersion.note_id.in_(note_ids)).delete(synchronize_session=False)
            Note.query.filter(Note.id.in_(note_ids)).delete(synchronize_session=False)
        
        Topic.query.filter(Topic.id.in_(topic_ids)).delete(synchronize_session=False)
        db.session.commit()

        return {"deleted_ids": topic_ids}
