from flask_caching import Cache
from flask_migrate import Migrate

from app.utils.db import db


cache = Cache()
migrate = Migrate()
