from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.course_material_service import CourseMaterialService

course_material_bp = Blueprint("course_material", __name__)


def get_current_user_context():
    return int(get_jwt_identity()), get_jwt().get("role")


@course_material_bp.route("/admin/courses/<int:course_id>/materials", methods=["GET"])
@course_material_bp.route("/courses/<int:course_id>/materials", methods=["GET"])
@jwt_required()
def get_course_materials(course_id):
    user_id, role = get_current_user_context()

    result, error = CourseMaterialService.get_materials_by_course(
        course_id=course_id,
        user_id=user_id,
        role=role
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 403

    return jsonify({
        "success": True,
        "data": result
    }), 200


@course_material_bp.route("/admin/courses/<int:course_id>/materials", methods=["POST"])
@course_material_bp.route("/courses/<int:course_id>/materials", methods=["POST"])
@jwt_required()
def upload_course_material(course_id):
    user_id, role = get_current_user_context()
    file = request.files.get("file")

    result, error = CourseMaterialService.upload_material(
        course_id=course_id,
        form_data=request.form,
        file=file,
        uploaded_by_user_id=user_id,
        role=role
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


@course_material_bp.route("/admin/course-materials/<int:material_id>", methods=["PUT"])
@course_material_bp.route("/course-materials/<int:material_id>", methods=["PUT"])
@jwt_required()
def update_course_material(material_id):
    user_id, role = get_current_user_context()
    data = request.get_json()

    result, error = CourseMaterialService.update_material(
        material_id=material_id,
        data=data,
        updated_by_user_id=user_id,
        role=role
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


@course_material_bp.route("/admin/course-materials/<int:material_id>/status", methods=["PATCH"])
@course_material_bp.route("/course-materials/<int:material_id>/status", methods=["PATCH"])
@jwt_required()
def update_course_material_status(material_id):
    user_id, role = get_current_user_context()
    data = request.get_json()

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active field is required"
        }), 400

    result, error = CourseMaterialService.update_material_status(
        material_id=material_id,
        is_active=data.get("is_active"),
        updated_by_user_id=user_id,
        role=role
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Course material status updated successfully",
        "data": result
    }), 200


@course_material_bp.route("/admin/course-materials/<int:material_id>/download", methods=["GET"])
@course_material_bp.route("/course-materials/<int:material_id>/download", methods=["GET"])
@jwt_required()
def download_course_material(material_id):
    user_id, role = get_current_user_context()

    material, error = CourseMaterialService.get_material_for_download(
        material_id=material_id,
        user_id=user_id,
        role=role
    )

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