from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.services.staff_report_service import StaffReportService

staff_report_bp = Blueprint("staff_report", __name__)


def staff_required():
    claims = get_jwt()
    return claims.get("role") == "Department Staff"


def get_filters():
    return {
        "start_date": request.args.get("start_date"),
        "end_date": request.args.get("end_date"),
        "month": request.args.get("month"),
        "year": request.args.get("year"),
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


@staff_report_bp.route("/reports/<string:report_type>", methods=["GET"])
@jwt_required()
def preview_report(report_type):
    if not staff_required():
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())
    filters = get_filters()

    result, error = StaffReportService.get_report_preview(
        user_id=user_id,
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


@staff_report_bp.route("/reports/<string:report_type>/export", methods=["GET"])
@jwt_required()
def export_report(report_type):
    if not staff_required():
        return jsonify({
            "success": False,
            "message": "Department Staff access required"
        }), 403

    user_id = int(get_jwt_identity())
    filters = get_filters()

    csv_file, error = StaffReportService.get_report_csv(
        user_id=user_id,
        report_type=report_type,
        filters=filters
    )

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    filename = f"staff_{report_type.replace('-', '_')}_report.csv"

    return csv_response(csv_file, filename)