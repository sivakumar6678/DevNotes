from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.services.technology_service import TechnologyService
from app.utils.auth import require_admin_user

def list_technologies():
    technologies = TechnologyService.list_technologies()
    return jsonify({
        "status": "success",
        "data": technologies
    })

@jwt_required()
def create_technology():
    require_admin_user()
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    slug = payload.get("slug")
    description = payload.get("description")
    
    if not name or not slug:
        return jsonify({"message": "Missing required fields: name and slug"}), 422
        
    technology = TechnologyService.create_technology(name=name, slug=slug, description=description)
    return jsonify({"technology": technology}), 201
