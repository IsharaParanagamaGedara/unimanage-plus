from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.student_assignment_service import StudentAssignmentService

student_assignment_bp = Blueprint("student_assignment", __name__)


def student_required():
    claims = get_jwt()
    return claims.get("role") == "Student"


@student_assignment_bp.route("/assignments", methods=["GET"])
@jwt_required()
def get_my_assignments():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = int(get_jwt_identity())
    search = request.args.get("search")

    result, error = StudentAssignmentService.get_my_assignments(
        user_id=user_id,
        search=search
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


@student_assignment_bp.route("/assignments/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment_detail(assignment_id):
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = int(get_jwt_identity())

    result, error = StudentAssignmentService.get_assignment_detail(
        user_id=user_id,
        assignment_id=assignment_id
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


@student_assignment_bp.route("/assignments/<int:assignment_id>/submit", methods=["POST"])
@jwt_required()
def submit_assignment(assignment_id):
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = int(get_jwt_identity())
    file = request.files.get("file")

    result, error = StudentAssignmentService.submit_assignment(
        user_id=user_id,
        assignment_id=assignment_id,
        form_data=request.form,
        file=file
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Assignment submitted successfully",
        "data": result
    }), 201


@student_assignment_bp.route("/submissions", methods=["GET"])
@jwt_required()
def get_my_submissions():
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    user_id = int(get_jwt_identity())

    result, error = StudentAssignmentService.get_my_submissions(user_id)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "data": result
    }), 200