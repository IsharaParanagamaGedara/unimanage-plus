from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.lecturer_course_service import LecturerCourseService

lecturer_course_bp = Blueprint("lecturer_course", __name__)


def lecturer_required():
    return get_jwt().get("role") == "Lecturer"


@lecturer_course_bp.route("/my-courses", methods=["GET"])
@jwt_required()
def get_my_courses():
    if not lecturer_required():
        return jsonify({
            "success": False,
            "message": "Lecturer access required"
        }), 403

    user_id = int(get_jwt_identity())

    result = LecturerCourseService.get_my_courses(user_id)

    return jsonify({
        "success": True,
        "data": result
    }), 200


@lecturer_course_bp.route("/my-courses/<int:course_id>", methods=["GET"])
@jwt_required()
def get_my_course_detail(course_id):
    if not lecturer_required():
        return jsonify({
            "success": False,
            "message": "Lecturer access required"
        }), 403

    user_id = int(get_jwt_identity())

    result, error = LecturerCourseService.get_course_detail(
        user_id=user_id,
        course_id=course_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200