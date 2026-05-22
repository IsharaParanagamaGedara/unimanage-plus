from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_analytics_service import AdminAnalyticsService

admin_analytics_bp = Blueprint("admin_analytics", __name__)


def admin_required():
    claims = get_jwt()
    return claims.get("role") == "Admin"


@admin_analytics_bp.route("/analytics/overview", methods=["GET"])
@jwt_required()
def get_analytics_overview():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    result = AdminAnalyticsService.get_overview()

    return jsonify({
        "success": True,
        "data": result
    }), 200