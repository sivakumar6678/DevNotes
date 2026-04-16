from app import create_app
import app.models  # ensure all ORM models are loaded
from app.utils.db import db


def main() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Tables created.")


if __name__ == "__main__":
    main()

