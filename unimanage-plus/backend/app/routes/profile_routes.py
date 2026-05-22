from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.profile_service import ProfileService

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    user_id = int(get_jwt_identity())

    result, error = ProfileService.get_my_profile(user_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 404

    return jsonify({
        "success": True,
        "data": result
    }), 200


@profile_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_my_profile():
    user_id = int(get_jwt_identity())

    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.form
        file = request.files.get("profile_image")
    else:
        data = request.get_json() or {}
        file = None

    result, error = ProfileService.update_my_profile(
        user_id=user_id,
        data=data,
        file=file
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Profile updated successfully",
        "data": result
    }), 200


@profile_bp.route("/change-password", methods=["PATCH"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    result, error = ProfileService.change_password(
        user_id=user_id,
        data=data
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Password changed successfully",
        "data": result
    }), 200