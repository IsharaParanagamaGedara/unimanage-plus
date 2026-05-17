from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.student_course_application_service import StudentCourseApplicationService

student_course_application_bp = Blueprint("student_course_application", __name__)


def student_required():
    claims = get_jwt()
    role = claims.get("role")

    if role != "Student":
        return False

    return True


@student_course_application_bp.route("/available-batches", methods=["GET"])
@jwt_required()
def get_available_batches():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()
    search = request.args.get("search")

    result, error = StudentCourseApplicationService.get_available_batches(
        user_id=user_id,
        search=search
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "data": result
    }), 200


@student_course_application_bp.route("/course-applications", methods=["POST"])
@jwt_required()
def apply_to_batch():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()
    data = request.get_json()

    result, error = StudentCourseApplicationService.apply_to_batch(
        user_id=user_id,
        data=data
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course application submitted successfully",
        "data": result
    }), 201


@student_course_application_bp.route("/course-applications", methods=["GET"])
@jwt_required()
def get_my_applications():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()

    result, error = StudentCourseApplicationService.get_my_applications(user_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "data": result
    }), 200