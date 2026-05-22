from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.dashboard_summary_service import DashboardSummaryService

dashboard_summary_bp = Blueprint("dashboard_summary", __name__)


def get_role():
    return get_jwt().get("role")


@dashboard_summary_bp.route("/admin/dashboard/summary", methods=["GET"])
@jwt_required()
def admin_dashboard_summary():
    if get_role() != "Admin":
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    return jsonify({
        "success": True,
        "data": DashboardSummaryService.get_admin_summary()
    }), 200


@dashboard_summary_bp.route("/lecturer/dashboard/summary", methods=["GET"])
@jwt_required()
def lecturer_dashboard_summary():
    if get_role() != "Lecturer":
        return jsonify({
            "success": False,
            "message": "Lecturer access required"
        }), 403

    user_id = int(get_jwt_identity())

    return jsonify({
        "success": True,
        "data": DashboardSummaryService.get_lecturer_summary(user_id)
    }), 200


@dashboard_summary_bp.route("/student/dashboard/summary", methods=["GET"])
@jwt_required()
def student_dashboard_summary():
    if get_role() != "Student":
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = int(get_jwt_identity())

    return jsonify({
        "success": True,
        "data": DashboardSummaryService.get_student_summary(user_id)
    }), 200


@dashboard_summary_bp.route("/staff/dashboard/summary", methods=["GET"])
@jwt_required()
def staff_dashboard_summary():
    if get_role() != "Department Staff":
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())

    return jsonify({
        "success": True,
        "data": DashboardSummaryService.get_staff_summary(user_id)
    }), 200