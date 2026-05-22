from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.services.admin_report_service import AdminReportService

admin_report_bp = Blueprint("admin_report", __name__)


def admin_required():
    claims = get_jwt()
    return claims.get("role") == "Admin"


def get_filters():
    return {
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
        "month": request.args.get("month"),
        "year": request.args.get("year"),
        "department_id": request.args.get("department_id"),
        "course_id": request.args.get("course_id"),
        "batch_id": request.args.get("batch_id"),
    }


def csv_response(csv_file, filename):
    return Response(
        csv_file.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@admin_report_bp.route("/reports/<string:report_type>", methods=["GET"])
@jwt_required()
def preview_report(report_type):
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    filters = get_filters()

    result, error = AdminReportService.get_report_preview(
        report_type=report_type,
        filters=filters
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


@admin_report_bp.route("/reports/<string:report_type>/export", methods=["GET"])
@jwt_required()
def export_report(report_type):
    if not admin_required():
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    filters = get_filters()

    csv_file, error = AdminReportService.get_report_csv(
        report_type=report_type,
        filters=filters
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    filename = f"{report_type.replace('-', '_')}_report.csv"

    return csv_response(csv_file, filename)