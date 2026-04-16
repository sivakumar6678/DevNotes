import os
from importlib.util import find_spec

from dotenv import load_dotenv

load_dotenv()


def _postgres_driver() -> str:
    # Prefer psycopg v3 when available, otherwise fall back to psycopg2.
    if find_spec("psycopg"):
        return "psycopg"
    if find_spec("psycopg2"):
        return "psycopg2"
    raise RuntimeError("No PostgreSQL driver found. Install `psycopg` or `psycopg2-binary` in the backend environment.")


def _normalize_db_url(url: str) -> str:
    # Supabase commonly provides `postgres://...` or `postgresql://...`
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql+"):
        return url
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", f"postgresql+{_postgres_driver()}://", 1)
    return url


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "change-me"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise RuntimeError("DATABASE_URL is required (Supabase Postgres connection string).")
        return _normalize_db_url(db_url)


def get_config() -> Config:
    return Config()
