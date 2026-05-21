import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.lecturer_grading_service import LecturerGradingService
from app.models.assignment_submission import AssignmentSubmission

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

    result = LecturerGradingService.get_submissions(
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        assignment_id=request.args.get("assignment_id"),
        batch_id=request.args.get("batch_id"),
        search=request.args.get("search")
    )

    return jsonify({"success": True, "data": result}), 200


@lecturer_grading_bp.route("/lecturer/submissions/<int:submission_id>", methods=["GET"])
@jwt_required()
def get_submission_detail(submission_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    result, error = LecturerGradingService.get_submission_by_id(
        submission_id=submission_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role")
    )

    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({"success": True, "data": result}), 200


@lecturer_grading_bp.route("/lecturer/submissions/<int:submission_id>/download", methods=["GET"])
@jwt_required()
def download_submission_file(submission_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    _, error = LecturerGradingService.get_submission_by_id(
        submission_id=submission_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role")
    )

    if error:
        return jsonify({"success": False, "message": error}), 403

    submission = AssignmentSubmission.query.get(submission_id)

    if not submission or not submission.file_path:
        return jsonify({
            "success": False,
            "message": "No file found for this submission"
        }), 404

    if not os.path.exists(submission.file_path):
        return jsonify({
            "success": False,
            "message": "Submission file not found on server"
        }), 404

    return send_file(
        submission.file_path,
        as_attachment=True,
        download_name=submission.file_name
    )


@lecturer_grading_bp.route("/lecturer/submissions/<int:submission_id>/grade", methods=["POST"])
@jwt_required()
def create_grade(submission_id):
    if not lecturer_or_admin_required():
        return jsonify({
            "success": False,
            "message": "Lecturer or Admin access required"
        }), 403

    result, error = LecturerGradingService.create_grade(
        submission_id=submission_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        data=request.get_json()
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

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

    result, error = LecturerGradingService.update_grade(
        grade_id=grade_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        data=request.get_json()
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

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

    result, error = LecturerGradingService.submit_grade_for_approval(
        grade_id=grade_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role")
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Grade submitted for approval successfully",
        "data": result
    }), 200