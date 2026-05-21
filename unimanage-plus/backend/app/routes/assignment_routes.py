import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.services.assignment_service import AssignmentService
from app.models.assignment import Assignment

assignment_bp = Blueprint("assignment", __name__)


def assignment_access_required():
    role = get_jwt().get("role")
    return role in ["Admin", "Lecturer", "Department Staff"]


@assignment_bp.route("/assignments", methods=["GET"])
@jwt_required()
def get_assignments():
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    result = AssignmentService.get_assignments(
        user_id=user_id,
        role=role,
        status=request.args.get("status"),
        batch_id=request.args.get("batch_id"),
        search=request.args.get("search")
    )

    return jsonify({"success": True, "data": result}), 200


@assignment_bp.route("/assignments", methods=["POST"])
@jwt_required()
def create_assignment():
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    result, error = AssignmentService.create_assignment(
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        form_data=request.form,
        file=request.files.get("attachment")
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Assignment created successfully",
        "data": result
    }), 201


@assignment_bp.route("/assignments/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment_detail(assignment_id):
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    result, error = AssignmentService.get_assignment_by_id(
        assignment_id=assignment_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role")
    )

    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({"success": True, "data": result}), 200


@assignment_bp.route("/assignments/<int:assignment_id>", methods=["PUT"])
@jwt_required()
def update_assignment(assignment_id):
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    result, error = AssignmentService.update_assignment(
        assignment_id=assignment_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        form_data=request.form,
        file=request.files.get("attachment")
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Assignment updated successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/submit-review", methods=["PATCH"])
@jwt_required()
def submit_assignment_for_review(assignment_id):
    result, error = AssignmentService.submit_for_review(
        assignment_id=assignment_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role")
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Assignment submitted for review successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/publish", methods=["PATCH"])
@jwt_required()
def publish_assignment(assignment_id):
    result, error = AssignmentService.publish_assignment(
        assignment_id=assignment_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        data=request.get_json() or {}
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Assignment published successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/status", methods=["PATCH"])
@jwt_required()
def update_assignment_status(assignment_id):
    result, error = AssignmentService.update_assignment_status(
        assignment_id=assignment_id,
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role"),
        data=request.get_json() or {}
    )

    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Assignment status updated successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/download", methods=["GET"])
@jwt_required()
def download_assignment_attachment(assignment_id):
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    _, error = AssignmentService.get_assignment_by_id(
        assignment_id=assignment_id,
        user_id=user_id,
        role=role
    )

    if error:
        return jsonify({"success": False, "message": error}), 403

    assignment = Assignment.query.get(assignment_id)

    if not assignment or not assignment.attachment_path:
        return jsonify({
            "success": False,
            "message": "No attachment found for this assignment"
        }), 404

    if not os.path.exists(assignment.attachment_path):
        return jsonify({
            "success": False,
            "message": "Attachment file not found on server"
        }), 404

    return send_file(
        assignment.attachment_path,
        as_attachment=True,
        download_name=assignment.attachment_name
    )


@assignment_bp.route("/assignments/batches", methods=["GET"])
@jwt_required()
def get_assignment_batches():
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    result = AssignmentService.get_assignment_batches(
        user_id=int(get_jwt_identity()),
        role=get_jwt().get("role")
    )

    return jsonify({"success": True, "data": result}), 200