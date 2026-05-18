from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.student_enrollment_service import StudentEnrollmentService

student_enrollment_bp = Blueprint("student_enrollment", __name__)


def student_required():
    claims = get_jwt()
    return claims.get("role") == "Student"


@student_enrollment_bp.route("/enrollments", methods=["GET"])
@jwt_required()
def get_my_enrollments():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()

    result, error = StudentEnrollmentService.get_my_enrollments(user_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "data": result
    }), 200