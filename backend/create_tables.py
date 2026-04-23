from app import create_app
import app.models  # ensure all ORM models are loaded
from app.services.auth_service import AuthService
from app.services.technology_service import TechnologyService
from app.services.topic_service import TopicService
from app.services.version_service import VersionService
from app.utils.db import db


def main() -> None:
    application = create_app()
    with application.app_context():
        # 1. Create brand-new tables (no-op for tables that already exist)
        db.create_all()
        print("✅ db.create_all() completed.")

        # 2. Incremental column migrations for existing tables
        AuthService.ensure_user_schema()          # users: status, avatar_url, role migration
        AuthService.ensure_admin_account()         # ensure super_admin user exists
        TechnologyService.ensure_technology_schema()  # technologies: icon_url, color, is_published, etc.
        TopicService.ensure_topic_schema()         # topics: node_type, sort_order, is_published, etc.
        VersionService.ensure_note_version_schema()   # note_versions: new columns + enum values

        print()
        print("✅ All tables created / migrated successfully.")
        print("   Tables: users, technologies, topics, note_versions,")
        print("           pull_requests, pr_comments, analytics_events")


if __name__ == "__main__":
    main()
