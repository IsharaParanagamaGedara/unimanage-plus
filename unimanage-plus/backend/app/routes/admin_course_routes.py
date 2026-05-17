from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import admin_required
from app.services.admin_course_service import AdminCourseService

admin_course_bp = Blueprint("admin_course", __name__)


@admin_course_bp.route("/courses", methods=["GET"])
@admin_required
def get_courses():
    search = request.args.get("search")
    department_id = request.args.get("department_id")
    status = request.args.get("status")

    courses = AdminCourseService.get_courses(
        search=search,
        department_id=department_id,
        status=status
    )

    return jsonify({
        "success": True,
        "data": courses
    }), 200


@admin_course_bp.route("/courses", methods=["POST"])
@admin_required
def create_course():
    data = request.get_json()
    created_by_user_id = get_jwt_identity()

    result, error = AdminCourseService.create_course(
        data,
        created_by_user_id=created_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course created successfully",
        "data": result
    }), 201


@admin_course_bp.route("/courses/<int:course_id>", methods=["GET"])
@admin_required
def get_course(course_id):
    result, error = AdminCourseService.get_course_by_id(course_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_course_bp.route("/courses/<int:course_id>", methods=["PUT"])
@admin_required
def update_course(course_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    result, error = AdminCourseService.update_course(
        course_id,
        data,
        updated_by_user_id=updated_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course updated successfully",
        "data": result
    }), 200


@admin_course_bp.route("/courses/<int:course_id>/status", methods=["PATCH"])
@admin_required
def update_course_status(course_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active field is required"
        }), 400

    result, error = AdminCourseService.update_course_status(
        course_id,
        data.get("is_active"),
        updated_by_user_id=updated_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "message": "Course status updated successfully",
        "data": result
    }), 200


@admin_course_bp.route("/courses/lecturers", methods=["GET"])
@admin_required
def get_active_lecturers():
    lecturers = AdminCourseService.get_active_lecturers()

    return jsonify({
        "success": True,
        "data": lecturers
    }), 200