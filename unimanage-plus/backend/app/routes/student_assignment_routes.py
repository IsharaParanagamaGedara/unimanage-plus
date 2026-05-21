import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.student_assignment_service import StudentAssignmentService
from app.models.assignment_submission import AssignmentSubmission

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

    result, error = StudentAssignmentService.get_my_assignments(
        user_id=int(get_jwt_identity()),
        search=request.args.get("search")
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({"success": True, "data": result}), 200


@student_assignment_bp.route("/assignments/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment_detail(assignment_id):
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    result, error = StudentAssignmentService.get_assignment_detail(
        user_id=int(get_jwt_identity()),
        assignment_id=assignment_id
    )

    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({"success": True, "data": result}), 200


@student_assignment_bp.route("/assignments/<int:assignment_id>/submit", methods=["POST"])
@jwt_required()
def submit_assignment(assignment_id):
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    result, error = StudentAssignmentService.submit_assignment(
        user_id=int(get_jwt_identity()),
        assignment_id=assignment_id,
        form_data=request.form,
        file=request.files.get("file")
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

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

    result, error = StudentAssignmentService.get_my_submissions(
        int(get_jwt_identity())
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({"success": True, "data": result}), 200


@student_assignment_bp.route("/submissions/<int:submission_id>/download", methods=["GET"])
@jwt_required()
def download_my_submission_file(submission_id):
    if not student_required():
        return jsonify({
            "success": False,
            "message": "Student access required"
        }), 403

    student, error = StudentAssignmentService.get_student_profile(
        int(get_jwt_identity())
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    submission = AssignmentSubmission.query.filter_by(
        id=submission_id,
        student_id=student.id
    ).first()

    if not submission:
        return jsonify({
            "success": False,
            "message": "Submission not found"
        }), 404

    if not submission.file_path:
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