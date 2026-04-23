from sqlalchemy import inspect, text

from app.models import Technology
from app.utils.db import db
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify


class TechnologyService:
    @staticmethod
    def ensure_technology_schema() -> None:
        """Add new columns to technologies table if they don't exist (incremental migration)."""
        inspector = inspect(db.engine)
        if "technologies" not in inspector.get_table_names():
            return

        columns = {col["name"] for col in inspector.get_columns("technologies")}
        migrations = []

        if "icon_url" not in columns:
            migrations.append("ALTER TABLE technologies ADD COLUMN IF NOT EXISTS icon_url TEXT")
        if "color" not in columns:
            migrations.append("ALTER TABLE technologies ADD COLUMN IF NOT EXISTS color VARCHAR(20)")
        if "is_published" not in columns:
            migrations.append("ALTER TABLE technologies ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE")
        if "sort_order" not in columns:
            migrations.append("ALTER TABLE technologies ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0")
        if "created_by" not in columns:
            migrations.append("ALTER TABLE technologies ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
        if "updated_at" not in columns:
            migrations.append("ALTER TABLE technologies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")

        for sql in migrations:
            db.session.execute(text(sql))

        if migrations:
            db.session.commit()
            print(f"[technologies] Applied {len(migrations)} schema migration(s).")

    @staticmethod
    def _serialize(t: Technology) -> dict:
        return {
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "description": t.description,
            "icon_url": t.icon_url,
            "color": t.color,
            "is_published": t.is_published,
            "sort_order": t.sort_order,
            "created_by": t.created_by,
        }

    @staticmethod
    def list_technologies(published_only: bool = False) -> list[dict]:
        query = Technology.query
        if published_only:
            query = query.filter_by(is_published=True)
        technologies = query.order_by(Technology.sort_order.asc(), Technology.name.asc()).all()
        return [TechnologyService._serialize(t) for t in technologies]

    @staticmethod
    def get_technology(tech_id: int) -> Technology:
        tech = db.session.get(Technology, tech_id)
        if not tech:
            raise NotFoundError("Technology not found.")
        return tech

    @staticmethod
    def get_technology_by_slug(slug: str) -> Technology:
        tech = Technology.query.filter_by(slug=slug).first()
        if not tech:
            raise NotFoundError("Technology not found.")
        return tech

    @staticmethod
    def _build_unique_slug(name: str, exclude_id: int | None = None) -> str:
        base_slug = slugify(name)
        candidate = base_slug
        counter = 2

        while True:
            query = Technology.query.filter_by(slug=candidate)
            if exclude_id is not None:
                query = query.filter(Technology.id != exclude_id)
            if not query.first():
                return candidate
            candidate = f"{base_slug}-{counter}"
            counter += 1

    @staticmethod
    def create_technology(
        *,
        name: str,
        slug: str | None = None,
        description: str | None = None,
        icon_url: str | None = None,
        color: str | None = None,
        sort_order: int = 0,
        created_by: int | None = None,
    ) -> dict:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValidationError("`name` is required.")

        existing = Technology.query.filter(Technology.name.ilike(normalized_name)).first()
        if existing:
            raise ValidationError("A technology with this name already exists.")

        final_slug = slug or TechnologyService._build_unique_slug(normalized_name)

        technology = Technology(
            name=normalized_name,
            slug=final_slug,
            description=description,
            icon_url=icon_url,
            color=color,
            sort_order=sort_order,
            created_by=created_by,
        )
        db.session.add(technology)
        db.session.commit()

        return TechnologyService._serialize(technology)

    @staticmethod
    def update_technology(tech_id: int, **kwargs) -> dict:
        tech = TechnologyService.get_technology(tech_id)

        allowed = {"name", "description", "icon_url", "color", "is_published", "sort_order"}
        for key, value in kwargs.items():
            if key in allowed and value is not None:
                setattr(tech, key, value)
            elif key == "is_published":          # allow False explicitly
                tech.is_published = value

        db.session.commit()
        return TechnologyService._serialize(tech)

    @staticmethod
    def delete_technology(tech_id: int) -> dict:
        tech = TechnologyService.get_technology(tech_id)
        db.session.delete(tech)
        db.session.commit()
        return {"deleted_id": tech_id}
