from flask import Blueprint, Response, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_report_service import AdminReportService

admin_report_bp = Blueprint("admin_report", __name__)


def admin_required():
    claims = get_jwt()
    return claims.get("role") == "Admin"


def csv_response(csv_file, filename):
    return Response(
        csv_file.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@admin_report_bp.route("/reports/students/export", methods=["GET"])
@jwt_required()
def export_students():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    csv_file = AdminReportService.student_report()
    return csv_response(csv_file, "student_list_report.csv")


@admin_report_bp.route("/reports/enrollments/export", methods=["GET"])
@jwt_required()
def export_enrollments():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    csv_file = AdminReportService.enrollment_report()
    return csv_response(csv_file, "course_enrollment_report.csv")


@admin_report_bp.route("/reports/course-applications/export", methods=["GET"])
@jwt_required()
def export_course_applications():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    csv_file = AdminReportService.course_application_report()
    return csv_response(csv_file, "course_application_report.csv")


@admin_report_bp.route("/reports/service-requests/export", methods=["GET"])
@jwt_required()
def export_service_requests():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    csv_file = AdminReportService.service_request_report()
    return csv_response(csv_file, "service_request_report.csv")


@admin_report_bp.route("/reports/submissions/export", methods=["GET"])
@jwt_required()
def export_submissions():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    csv_file = AdminReportService.assignment_submission_report()
    return csv_response(csv_file, "assignment_submission_report.csv")


@admin_report_bp.route("/reports/grades/export", methods=["GET"])
@jwt_required()
def export_grades():
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    csv_file = AdminReportService.grade_report()
    return csv_response(csv_file, "grade_report.csv")