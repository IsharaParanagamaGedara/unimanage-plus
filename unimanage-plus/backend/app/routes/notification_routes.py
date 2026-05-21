from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import NotificationService

notification_bp = Blueprint("notification", __name__)


@notification_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_my_notifications():
    user_id = int(get_jwt_identity())
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    result = NotificationService.get_my_notifications(
        user_id=user_id,
        unread_only=unread_only
    )

    return jsonify({
        "success": True,
        "data": result
    }), 200


@notification_bp.route("/notifications/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())

    count = NotificationService.get_unread_count(user_id)

    return jsonify({
        "success": True,
        "data": {
            "unread_count": count
        }
    }), 200


@notification_bp.route("/notifications/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_notification_as_read(notification_id):
    user_id = int(get_jwt_identity())

    result, error = NotificationService.mark_as_read(
        user_id=user_id,
        notification_id=notification_id
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "message": "Notification marked as read",
        "data": result
    }), 200


@notification_bp.route("/notifications/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_notifications_as_read():
    user_id = int(get_jwt_identity())

    NotificationService.mark_all_as_read(user_id)

    return jsonify({
        "success": True,
        "message": "All notifications marked as read"
    }), 200