from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.assignment_service import AssignmentService

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

    status = request.args.get("status")
    batch_id = request.args.get("batch_id")
    search = request.args.get("search")

    result = AssignmentService.get_assignments(
        user_id=user_id,
        role=role,
        status=status,
        batch_id=batch_id,
        search=search
    )

    return jsonify({
        "success": True,
        "data": result
    }), 200


@assignment_bp.route("/assignments", methods=["POST"])
@jwt_required()
def create_assignment():
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    file = request.files.get("attachment")

    result, error = AssignmentService.create_assignment(
        user_id=user_id,
        role=role,
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

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    result, error = AssignmentService.get_assignment_by_id(
        assignment_id=assignment_id,
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


@assignment_bp.route("/assignments/<int:assignment_id>", methods=["PUT"])
@jwt_required()
def update_assignment(assignment_id):
    if not assignment_access_required():
        return jsonify({
            "success": False,
            "message": "Assignment management access required"
        }), 403

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    file = request.files.get("attachment")

    result, error = AssignmentService.update_assignment(
        assignment_id=assignment_id,
        user_id=user_id,
        role=role,
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
        "message": "Assignment updated successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/submit-review", methods=["PATCH"])
@jwt_required()
def submit_assignment_for_review(assignment_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    result, error = AssignmentService.submit_for_review(
        assignment_id=assignment_id,
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
        "message": "Assignment submitted for review successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/publish", methods=["PATCH"])
@jwt_required()
def publish_assignment(assignment_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json() or {}

    result, error = AssignmentService.publish_assignment(
        assignment_id=assignment_id,
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
        "message": "Assignment published successfully",
        "data": result
    }), 200


@assignment_bp.route("/assignments/<int:assignment_id>/status", methods=["PATCH"])
@jwt_required()
def update_assignment_status(assignment_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    data = request.get_json() or {}

    result, error = AssignmentService.update_assignment_status(
        assignment_id=assignment_id,
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
        "message": "Assignment status updated successfully",
        "data": result
    }), 200