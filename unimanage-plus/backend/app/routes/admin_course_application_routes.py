from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.admin_course_application_service import AdminCourseApplicationService

admin_course_application_bp = Blueprint("admin_course_application", __name__)


def reviewer_required():
    claims = get_jwt()
    role = claims.get("role")

    if role not in ["Admin", "Department Staff"]:
        return False

    return True


@admin_course_application_bp.route("/course-applications", methods=["GET"])
@jwt_required()
def get_course_applications():
    if not reviewer_required():
        return jsonify({
            "success": False,
            "message": "Admin or Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    search = request.args.get("search")
    status = request.args.get("status")
    batch_id = request.args.get("batch_id")

    applications = AdminCourseApplicationService.get_applications(
        user_id=user_id,
        role=role,
        search=search,
        status=status,
        batch_id=batch_id
    )

    return jsonify({
        "success": True,
        "data": applications
    }), 200


@admin_course_application_bp.route("/course-applications/<int:application_id>/review", methods=["PATCH"])
@jwt_required()
def review_course_application(application_id):
    if not reviewer_required():
        return jsonify({
            "success": False,
            "message": "Admin or Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json()

    result, error = AdminCourseApplicationService.review_application(
        application_id=application_id,
        data=data,
        reviewed_by_user_id=user_id,
        role=role
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course application reviewed successfully",
        "data": result
    }), 200