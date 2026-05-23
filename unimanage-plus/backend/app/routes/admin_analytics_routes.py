from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_analytics_service import AdminAnalyticsService

admin_analytics_bp = Blueprint("admin_analytics", __name__)


def admin_required():
    claims = get_jwt()
    return claims.get("role") == "Admin"


def get_filters():
    return {
        "department_id": request.args.get("department_id"),
        "course_id": request.args.get("course_id"),
        "batch_id": request.args.get("batch_id"),
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
        "month": request.args.get("month"),
        "year": request.args.get("year"),
    }


@admin_analytics_bp.route("/analytics/overview", methods=["GET"])
@jwt_required()
def get_analytics_overview():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    result = AdminAnalyticsService.get_overview(get_filters())

    return jsonify({
        "success": True,
        "data": result
    }), 200