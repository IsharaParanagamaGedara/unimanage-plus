from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.lecturer_grading_service import LecturerGradingService

lecturer_grading_bp = Blueprint("lecturer_grading", __name__)


def lecturer_or_admin_required():
    role = get_jwt().get("role")
    return role in ["Lecturer", "Admin"]


@lecturer_grading_bp.route("/lecturer/submissions", methods=["GET"])
@jwt_required()
def get_submissions():
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    assignment_id = request.args.get("assignment_id")
    batch_id = request.args.get("batch_id")
    search = request.args.get("search")

    result = LecturerGradingService.get_submissions(
        user_id=user_id,
        role=role,
        assignment_id=assignment_id,
        batch_id=batch_id,
        search=search
    )

    return jsonify({
        "success": True,
        "data": result
    }), 200


@lecturer_grading_bp.route("/lecturer/submissions/<int:submission_id>", methods=["GET"])
@jwt_required()
def get_submission_detail(submission_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    result, error = LecturerGradingService.get_submission_by_id(
        submission_id=submission_id,
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


@lecturer_grading_bp.route("/lecturer/submissions/<int:submission_id>/grade", methods=["POST"])
@jwt_required()
def create_grade(submission_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json()

    result, error = LecturerGradingService.create_grade(
        submission_id=submission_id,
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
        "message": "Draft grade created successfully",
        "data": result
    }), 201


@lecturer_grading_bp.route("/lecturer/grades/<int:grade_id>", methods=["PUT"])
@jwt_required()
def update_grade(grade_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json()

    result, error = LecturerGradingService.update_grade(
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
        "message": "Draft grade updated successfully",
        "data": result
    }), 200


@lecturer_grading_bp.route("/lecturer/grades/<int:grade_id>/submit-approval", methods=["PATCH"])
@jwt_required()
def submit_grade_for_approval(grade_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    result, error = LecturerGradingService.submit_grade_for_approval(
        grade_id=grade_id,
        user_id=user_id,
        role=role
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    return jsonify({
        "success": True,
        "message": "Grade submitted for approval successfully",
        "data": result
    }), 200