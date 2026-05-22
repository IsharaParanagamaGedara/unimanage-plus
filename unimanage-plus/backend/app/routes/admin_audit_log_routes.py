from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_audit_log_service import AdminAuditLogService

admin_audit_log_bp = Blueprint("admin_audit_log", __name__)


def admin_required():
    claims = get_jwt()
    return claims.get("role") == "Admin"


def get_filters():
    return {
        "search": request.args.get("search"),
        "action": request.args.get("action"),
        "user_id": request.args.get("user_id"),
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
        "month": request.args.get("month"),
        "year": request.args.get("year"),
    }


@admin_audit_log_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
def get_audit_logs():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    result = AdminAuditLogService.get_audit_logs(get_filters())

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_audit_log_bp.route("/audit-logs/actions", methods=["GET"])
@jwt_required()
def get_audit_log_actions():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    result = AdminAuditLogService.get_actions()

    return jsonify({
        "success": True,
        "data": result
    }), 200


@admin_audit_log_bp.route("/audit-logs/<int:log_id>", methods=["GET"])
@jwt_required()
def get_audit_log_detail(log_id):
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    result, error = AdminAuditLogService.get_audit_log_by_id(log_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200