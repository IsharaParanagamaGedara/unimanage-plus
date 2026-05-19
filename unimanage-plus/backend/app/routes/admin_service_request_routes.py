from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.admin_service_request_service import AdminServiceRequestService

admin_service_request_bp = Blueprint("admin_service_request", __name__)


def admin_or_staff_required():
    claims = get_jwt()
    return claims.get("role") in ["Admin", "Department Staff"]


@admin_service_request_bp.route("/service-requests", methods=["GET"])
@jwt_required()
def get_service_requests():
    if not admin_or_staff_required():
        return jsonify({
            "success": False,
            "message": "Admin or Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    search = request.args.get("search")
    status = request.args.get("status")
    request_type = request.args.get("request_type")
    priority = request.args.get("priority")

    result = AdminServiceRequestService.get_requests(
        user_id=user_id,
        role=role,
        search=search,
        status=status,
        request_type=request_type,
        priority=priority
    )

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_service_request_bp.route("/service-requests/<int:request_id>", methods=["GET"])
@jwt_required()
def get_service_request_detail(request_id):
    if not admin_or_staff_required():
        return jsonify({
            "success": False,
            "message": "Admin or Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    result, error = AdminServiceRequestService.get_request_by_id(
        request_id=request_id,
        user_id=user_id,
        role=role
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


@admin_service_request_bp.route("/service-requests/<int:request_id>/status", methods=["PATCH"])
@jwt_required()
def update_service_request_status(request_id):
    if not admin_or_staff_required():
        return jsonify({
            "success": False,
            "message": "Admin or Department Staff access required"
        }), 403

    changed_by_user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json()

    result, error = AdminServiceRequestService.update_status(
        request_id=request_id,
        data=data,
        changed_by_user_id=changed_by_user_id,
        role=role
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Service request status updated successfully",
        "data": result
    }), 200


@admin_service_request_bp.route("/service-requests/assignable-users", methods=["GET"])
@jwt_required()
def get_assignable_users():
    if not admin_or_staff_required():
        return jsonify({
            "success": False,
            "message": "Admin or Department Staff access required"
        }), 403

    result = AdminServiceRequestService.get_assignable_users()

    return jsonify({
        "success": True,
        "data": result
    }), 200