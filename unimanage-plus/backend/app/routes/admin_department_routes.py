from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import admin_required
from app.services.admin_department_service import AdminDepartmentService

admin_department_bp = Blueprint("admin_department", __name__)


@admin_department_bp.route("/departments/manage", methods=["GET"])
@admin_required
def get_departments():
    search = request.args.get("search")
    status = request.args.get("status")

    departments = AdminDepartmentService.get_departments(
        search=search,
        status=status
    )

    return jsonify({
        "success": True,
        "data": departments
    }), 200


@admin_department_bp.route("/departments", methods=["POST"])
@admin_required
def create_department():
    data = request.get_json()
    created_by_user_id = get_jwt_identity()

    result, error = AdminDepartmentService.create_department(
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
        "message": "Department created successfully",
        "data": result
    }), 201


@admin_department_bp.route("/departments/<int:department_id>", methods=["GET"])
@admin_required
def get_department(department_id):
    result, error = AdminDepartmentService.get_department_by_id(department_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_department_bp.route("/departments/<int:department_id>", methods=["PUT"])
@admin_required
def update_department(department_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    result, error = AdminDepartmentService.update_department(
        department_id,
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
        "message": "Department updated successfully",
        "data": result
    }), 200


@admin_department_bp.route("/departments/<int:department_id>/status", methods=["PATCH"])
@admin_required
def update_department_status(department_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active field is required"
        }), 400

    result, error = AdminDepartmentService.update_department_status(
        department_id,
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
        "message": "Department status updated successfully",
        "data": result
    }), 200