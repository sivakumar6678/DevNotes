from app.models import Technology
from app.utils.db import db
from app.utils.errors import NotFoundError, ValidationError
from app.utils.slugify import slugify

class TechnologyService:
    @staticmethod
    def list_technologies() -> list[dict]:
        technologies = Technology.query.order_by(Technology.name.asc()).all()
        return [{"id": t.id, "name": t.name, "slug": t.slug, "description": t.description} for t in technologies]

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
    def create_technology(*, name: str, slug: str, description: str | None = None) -> dict:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValidationError("`name` is required.")

        existing = Technology.query.filter(Technology.name.ilike(normalized_name)).first()
        if existing:
            raise ValidationError("A technology with this name already exists.")

        technology = Technology(
            name=normalized_name,
            slug=slug,
            description=description
        )
        db.session.add(technology)
        db.session.commit()

        return {"id": technology.id, "name": technology.name, "slug": technology.slug, "description": technology.description}
