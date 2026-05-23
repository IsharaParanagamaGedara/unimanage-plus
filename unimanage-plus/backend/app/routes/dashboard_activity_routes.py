from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.dashboard_activity_service import DashboardActivityService

dashboard_activity_bp = Blueprint("dashboard_activity", __name__)


def get_role():
    return get_jwt().get("role")


@dashboard_activity_bp.route("/admin/dashboard/activity", methods=["GET"])
@jwt_required()
def admin_dashboard_activity():
    if get_role() != "Admin":
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    return jsonify({
        "success": True,
        "data": DashboardActivityService.get_admin_activity()
    }), 200


@dashboard_activity_bp.route("/lecturer/dashboard/activity", methods=["GET"])
@jwt_required()
def lecturer_dashboard_activity():
    if get_role() != "Lecturer":
        return jsonify({
            "success": False,
            "message": "Lecturer access required"
        }), 403

    user_id = int(get_jwt_identity())

    return jsonify({
        "success": True,
        "data": DashboardActivityService.get_lecturer_activity(user_id)
    }), 200


@dashboard_activity_bp.route("/student/dashboard/activity", methods=["GET"])
@jwt_required()
def student_dashboard_activity():
    if get_role() != "Student":
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = int(get_jwt_identity())

    return jsonify({
        "success": True,
        "data": DashboardActivityService.get_student_activity(user_id)
    }), 200


@dashboard_activity_bp.route("/staff/dashboard/activity", methods=["GET"])
@jwt_required()
def staff_dashboard_activity():
    if get_role() != "Department Staff":
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())

    return jsonify({
        "success": True,
        "data": DashboardActivityService.get_staff_activity(user_id)
    }), 200