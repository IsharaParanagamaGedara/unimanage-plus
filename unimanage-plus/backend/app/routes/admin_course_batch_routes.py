from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import admin_required
from app.services.admin_course_batch_service import AdminCourseBatchService

admin_course_batch_bp = Blueprint("admin_course_batch", __name__)


@admin_course_batch_bp.route("/course-batches", methods=["GET"])
@admin_required
def get_batches():
    search = request.args.get("search")
    course_id = request.args.get("course_id")
    status = request.args.get("status")

    batches = AdminCourseBatchService.get_batches(
        search=search,
        course_id=course_id,
        status=status
    )

    return jsonify({
        "success": True,
        "data": batches
    }), 200


@admin_course_batch_bp.route("/course-batches", methods=["POST"])
@admin_required
def create_batch():
    data = request.get_json()
    created_by_user_id = get_jwt_identity()

    result, error = AdminCourseBatchService.create_batch(
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
        "message": "Course batch created successfully",
        "data": result
    }), 201


@admin_course_batch_bp.route("/course-batches/<int:batch_id>", methods=["GET"])
@admin_required
def get_batch(batch_id):
    result, error = AdminCourseBatchService.get_batch_by_id(batch_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_course_batch_bp.route("/course-batches/<int:batch_id>", methods=["PUT"])
@admin_required
def update_batch(batch_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    result, error = AdminCourseBatchService.update_batch(
        batch_id,
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
        "message": "Course batch updated successfully",
        "data": result
    }), 200


@admin_course_batch_bp.route("/course-batches/<int:batch_id>/status", methods=["PATCH"])
@admin_required
def update_batch_status(batch_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active field is required"
        }), 400

    result, error = AdminCourseBatchService.update_batch_status(
        batch_id,
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
        "message": "Course batch status updated successfully",
        "data": result
    }), 200


@admin_course_batch_bp.route("/course-batches/coordinators", methods=["GET"])
@admin_required
def get_coordinators():
    coordinators = AdminCourseBatchService.get_coordinators()

    return jsonify({
        "success": True,
        "data": coordinators
    }), 200