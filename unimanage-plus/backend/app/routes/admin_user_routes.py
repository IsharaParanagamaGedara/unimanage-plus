from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.utils.decorators import admin_required
from app.services.admin_user_service import AdminUserService

admin_user_bp = Blueprint("admin_user", __name__)


@admin_user_bp.route("/roles", methods=["GET"])
@admin_required
def get_roles():
    roles = AdminUserService.get_roles()

    return jsonify({
        "success": True,
        "data": roles
    }), 200


@admin_user_bp.route("/departments", methods=["GET"])
@admin_required
def get_departments():
    departments = AdminUserService.get_departments()

    return jsonify({
        "success": True,
        "data": departments
    }), 200


@admin_user_bp.route("/users", methods=["GET"])
@admin_required
def get_users():
    search = request.args.get("search")
    role_id = request.args.get("role_id")
    status = request.args.get("status")

    users = AdminUserService.get_all_users(
        search=search,
        role_id=role_id,
        status=status
    )

    return jsonify({
        "success": True,
        "data": users
    }), 200


@admin_user_bp.route("/users", methods=["POST"])
@admin_required
def create_user():
    data = request.get_json()
    created_by_user_id = get_jwt_identity()

    result, error = AdminUserService.create_user(
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
        "message": "User created successfully",
        "data": result
    }), 201


@admin_user_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user(user_id):
    result, error = AdminUserService.get_user_by_id(user_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_user_bp.route("/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    result, error = AdminUserService.update_user(
        user_id,
        data,
        updated_by_user_id=updated_by_user_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "message": "User updated successfully",
        "data": result
    }), 200


@admin_user_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@admin_required
def update_user_status(user_id):
    data = request.get_json()
    updated_by_user_id = get_jwt_identity()

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active field is required"
        }), 400

    result, error = AdminUserService.update_user_status(
        user_id,
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
        "message": "User status updated successfully",
        "data": result
    }), 200