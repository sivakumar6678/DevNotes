from app import create_app
import app.models  # ensure all ORM models are loaded
from app.services.auth_service import AuthService
from app.services.topic_service import TopicService
from app.utils.db import db


def main() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        AuthService.ensure_user_schema()
        AuthService.ensure_admin_account()
        TopicService.ensure_topic_schema()
        print("Tables created.")


if __name__ == "__main__":
    main()
