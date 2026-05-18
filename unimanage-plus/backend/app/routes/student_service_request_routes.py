from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.student_service_request_service import StudentServiceRequestService

student_service_request_bp = Blueprint("student_service_request", __name__)


def student_required():
    claims = get_jwt()
    return claims.get("role") == "Student"


@student_service_request_bp.route("/service-requests", methods=["POST"])
@jwt_required()
def create_service_request():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()
    data = request.get_json()

    result, error = StudentServiceRequestService.create_request(
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
        "message": "Service request submitted successfully",
        "data": result
    }), 201


@student_service_request_bp.route("/service-requests", methods=["GET"])
@jwt_required()
def get_my_service_requests():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()
    status = request.args.get("status")
    request_type = request.args.get("request_type")

    result, error = StudentServiceRequestService.get_my_requests(
        user_id=user_id,
        status=status,
        request_type=request_type
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "data": result
    }), 200


@student_service_request_bp.route("/service-requests/<int:request_id>", methods=["GET"])
@jwt_required()
def get_my_service_request_detail(request_id):
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = get_jwt_identity()

    result, error = StudentServiceRequestService.get_request_by_id(
        user_id=user_id,
        request_id=request_id
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