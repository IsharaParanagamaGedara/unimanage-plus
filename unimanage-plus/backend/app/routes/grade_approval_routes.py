from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.grade_approval_service import GradeApprovalService

grade_approval_bp = Blueprint("grade_approval", __name__)


def coordinator_or_admin_required():
    role = get_jwt().get("role")
    return role in ["Admin", "Department Staff"]


@grade_approval_bp.route("/grades/pending-approval", methods=["GET"])
@jwt_required()
def get_pending_grades():
    if not coordinator_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Admin or Course Coordinator access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    batch_id = request.args.get("batch_id")
    search = request.args.get("search")

    result = GradeApprovalService.get_pending_grades(
        user_id=user_id,
        role=role,
        batch_id=batch_id,
        search=search
    )

    return jsonify({
        "success": True,
        "data": result
    }), 200


@grade_approval_bp.route("/grades/<int:grade_id>/publish", methods=["PATCH"])
@jwt_required()
def publish_grade(grade_id):
    if not coordinator_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Admin or Course Coordinator access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json() or {}

    result, error = GradeApprovalService.publish_grade(
        grade_id=grade_id,
        user_id=user_id,
        role=role,
        data=data
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Grade published successfully",
        "data": result
    }), 200


@grade_approval_bp.route("/grades/<int:grade_id>/return", methods=["PATCH"])
@jwt_required()
def return_grade(grade_id):
    if not coordinator_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Admin or Course Coordinator access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json() or {}

    result, error = GradeApprovalService.return_grade(
        grade_id=grade_id,
        user_id=user_id,
        role=role,
        data=data
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Grade returned to Draft successfully",
        "data": result
    }), 200