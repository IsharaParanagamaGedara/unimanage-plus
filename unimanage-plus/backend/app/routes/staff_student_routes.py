from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.services.staff_student_service import StaffStudentService

staff_student_bp = Blueprint("staff_student", __name__)


def staff_required():
    claims = get_jwt()
    return claims.get("role") == "Department Staff"


@staff_student_bp.route("/students", methods=["GET"])
@jwt_required()
def get_students():
    if not staff_required():
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())

    result, error = StaffStudentService.get_students(
        user_id=user_id,
        search=request.args.get("search"),
        programme=request.args.get("programme"),
        year_of_study=request.args.get("year_of_study")
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


@staff_student_bp.route("/students/filter-options", methods=["GET"])
@jwt_required()
def get_filter_options():
    if not staff_required():
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())

    result, error = StaffStudentService.get_filter_options(user_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "data": result
    }), 200


@staff_student_bp.route("/students/<int:student_id>", methods=["GET"])
@jwt_required()
def get_student_detail(student_id):
    if not staff_required():
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())

    result, error = StaffStudentService.get_student_by_id(
        user_id=user_id,
        student_id=student_id
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