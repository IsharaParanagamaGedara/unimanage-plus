from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import admin_required
from app.services.course_material_service import CourseMaterialService

course_material_bp = Blueprint("course_material", __name__)


@course_material_bp.route("/courses/<int:course_id>/materials", methods=["GET"])
@admin_required
def get_course_materials(course_id):
    result, error = CourseMaterialService.get_materials_by_course(course_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200


@course_material_bp.route("/courses/<int:course_id>/materials", methods=["POST"])
@admin_required
def upload_course_material(course_id):
    uploaded_by_user_id = get_jwt_identity()

    file = request.files.get("file")

    result, error = CourseMaterialService.upload_material(
        course_id=course_id,
        form_data=request.form,
        file=file,
        uploaded_by_user_id=uploaded_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course material uploaded successfully",
        "data": result
    }), 201


@course_material_bp.route("/course-materials/<int:material_id>", methods=["PUT"])
@admin_required
def update_course_material(material_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    result, error = CourseMaterialService.update_material(
        material_id=material_id,
        data=data,
        updated_by_user_id=updated_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course material updated successfully",
        "data": result
    }), 200


@course_material_bp.route("/course-materials/<int:material_id>/status", methods=["PATCH"])
@admin_required
def update_course_material_status(material_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active field is required"
        }), 400

    result, error = CourseMaterialService.update_material_status(
        material_id=material_id,
        is_active=data.get("is_active"),
        updated_by_user_id=updated_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "message": "Course material status updated successfully",
        "data": result
    }), 200


@course_material_bp.route("/course-materials/<int:material_id>/download", methods=["GET"])
@admin_required
def download_course_material(material_id):
    material, error = CourseMaterialService.get_material_for_download(material_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return send_file(
        material.file_path,
        as_attachment=True,
        download_name=material.file_name
    )