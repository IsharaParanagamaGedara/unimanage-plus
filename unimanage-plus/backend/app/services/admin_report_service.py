import csv
import io
from datetime import datetime, date
from app.extensions import db
from app.models.student import Student
from app.models.course_application import CourseApplication
from app.models.batch_enrollment import BatchEnrollment
from app.models.service_request import ServiceRequest
from app.models.assignment_submission import AssignmentSubmission
from app.models.grade import Grade


class AdminReportService:

    @staticmethod
    def parse_date(value):
        if not value:
            return None

        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return None

    @staticmethod
    def apply_date_filter(query, column, filters):
        start_date = AdminReportService.parse_date(filters.get("start_date"))
        end_date = AdminReportService.parse_date(filters.get("end_date"))
        month = filters.get("month")
        year = filters.get("year")

        if start_date:
            query = query.filter(db.func.date(column) >= start_date)

        if end_date:
            query = query.filter(db.func.date(column) <= end_date)

        if month and year:
            query = query.filter(db.extract("month", column) == int(month))
            query = query.filter(db.extract("year", column) == int(year))
        elif year:
            query = query.filter(db.extract("year", column) == int(year))

        return query

    @staticmethod
    def generate_csv(headers, rows):
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(headers)
        writer.writerows(rows)

        output.seek(0)
        return output

    @staticmethod
    def build_response(headers, rows):
        return {
            "headers": headers,
            "rows": rows,
            "total_records": len(rows)
        }

    # -------------------------
    # Student Report
    # -------------------------
    @staticmethod
    def student_report_data(filters=None):
        filters = filters or {}

        headers = [
            "Student Number",
            "First Name",
            "Last Name",
            "Email",
            "Academic Email",
            "Department",
            "Programme",
            "Year of Study",
            "Enrollment Date",
        ]

        query = Student.query

        if filters:
            query = AdminReportService.apply_date_filter(
                query,
                Student.enrollment_date,
                filters
            )

        students = query.order_by(Student.id.desc()).all()

        rows = [
            [
                student.student_number,
                student.user.first_name if student.user else "",
                student.user.last_name if student.user else "",
                student.user.email if student.user else "",
                student.academic_email,
                student.department.name if student.department else "",
                student.programme_name,
                student.year_of_study,
                student.enrollment_date.isoformat() if student.enrollment_date else "",
            ]
            for student in students
        ]

        return headers, rows

    @staticmethod
    def student_report(filters=None):
        headers, rows = AdminReportService.student_report_data(filters)
        return AdminReportService.generate_csv(headers, rows)

    # -------------------------
    # Enrollment Report
    # -------------------------
    @staticmethod
    def enrollment_report_data(filters=None):
        filters = filters or {}

        headers = [
            "Student Number",
            "Student Name",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Batch Name",
            "Enrollment Status",
            "Enrolled At",
        ]

        query = BatchEnrollment.query

        if filters:
            query = AdminReportService.apply_date_filter(
                query,
                BatchEnrollment.enrolled_at,
                filters
            )

        enrollments = query.order_by(BatchEnrollment.enrolled_at.desc()).all()

        rows = []

        for enrollment in enrollments:
            student = enrollment.student
            user = student.user if student else None
            batch = enrollment.batch
            course = batch.course if batch else None

            rows.append([
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                batch.batch_name if batch else "",
                enrollment.enrollment_status,
                enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else "",
            ])

        return headers, rows

    @staticmethod
    def enrollment_report(filters=None):
        headers, rows = AdminReportService.enrollment_report_data(filters)
        return AdminReportService.generate_csv(headers, rows)

    # -------------------------
    # Course Application Report
    # -------------------------
    @staticmethod
    def course_application_report_data(filters=None):
        filters = filters or {}

        headers = [
            "Application ID",
            "Student Number",
            "Student Name",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Batch Name",
            "Status",
            "Applied At",
            "Reviewed At",
            "Review Note",
        ]

        query = CourseApplication.query

        if filters:
            query = AdminReportService.apply_date_filter(
                query,
                CourseApplication.applied_at,
                filters
            )

        applications = query.order_by(CourseApplication.applied_at.desc()).all()

        rows = []

        for application in applications:
            student = application.student
            user = student.user if student else None
            batch = application.batch
            course = batch.course if batch else None

            rows.append([
                application.id,
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                batch.batch_name if batch else "",
                application.status,
                application.applied_at.isoformat() if application.applied_at else "",
                application.reviewed_at.isoformat() if application.reviewed_at else "",
                application.review_note or "",
            ])

        return headers, rows

    @staticmethod
    def course_application_report(filters=None):
        headers, rows = AdminReportService.course_application_report_data(filters)
        return AdminReportService.generate_csv(headers, rows)

    # -------------------------
    # Service Request Report
    # -------------------------
    @staticmethod
    def service_request_report_data(filters=None):
        filters = filters or {}

        headers = [
            "Request ID",
            "Student Number",
            "Student Name",
            "Request Type",
            "Subject",
            "Priority",
            "Status",
            "Assigned To",
            "Submitted At",
            "Resolved At",
            "Resolution Note",
        ]

        query = ServiceRequest.query

        if filters:
            query = AdminReportService.apply_date_filter(
                query,
                ServiceRequest.submitted_at,
                filters
            )

        requests = query.order_by(ServiceRequest.submitted_at.desc()).all()

        rows = []

        for request_item in requests:
            student = request_item.student
            student_user = student.user if student else None
            assigned_user = request_item.assigned_user

            rows.append([
                request_item.id,
                student.student_number if student else "",
                f"{student_user.first_name} {student_user.last_name}" if student_user else "",
                request_item.request_type,
                request_item.subject,
                request_item.priority,
                request_item.status,
                f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else "",
                request_item.submitted_at.isoformat() if request_item.submitted_at else "",
                request_item.resolved_at.isoformat() if request_item.resolved_at else "",
                request_item.resolution_note or "",
            ])

        return headers, rows

    @staticmethod
    def service_request_report(filters=None):
        headers, rows = AdminReportService.service_request_report_data(filters)
        return AdminReportService.generate_csv(headers, rows)

    # -------------------------
    # Assignment Submission Report
    # -------------------------
    @staticmethod
    def assignment_submission_report_data(filters=None):
        filters = filters or {}

        headers = [
            "Submission ID",
            "Student Number",
            "Student Name",
            "Assignment Title",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Status",
            "Submitted At",
            "File Name",
        ]

        query = AssignmentSubmission.query

        if filters:
            query = AdminReportService.apply_date_filter(
                query,
                AssignmentSubmission.submitted_at,
                filters
            )

        submissions = query.order_by(AssignmentSubmission.submitted_at.desc()).all()

        rows = []

        for submission in submissions:
            student = submission.student
            user = student.user if student else None
            assignment = submission.assignment
            batch = assignment.course_batch if assignment else None
            course = batch.course if batch else None

            rows.append([
                submission.id,
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                assignment.title if assignment else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                submission.status,
                submission.submitted_at.isoformat() if submission.submitted_at else "",
                submission.file_name or "",
            ])

        return headers, rows

    @staticmethod
    def assignment_submission_report(filters=None):
        headers, rows = AdminReportService.assignment_submission_report_data(filters)
        return AdminReportService.generate_csv(headers, rows)

    # -------------------------
    # Grade Report
    # -------------------------
    @staticmethod
    def grade_report_data(filters=None):
        filters = filters or {}

        headers = [
            "Grade ID",
            "Student Number",
            "Student Name",
            "Assignment Title",
            "Course Code",
            "Course Name",
            "Batch Code",
            "Marks",
            "Max Marks",
            "Grade Status",
            "Feedback",
            "Graded At",
            "Published At",
        ]

        query = Grade.query

        if filters:
            query = AdminReportService.apply_date_filter(
                query,
                Grade.graded_at,
                filters
            )

        grades = query.order_by(Grade.graded_at.desc()).all()

        rows = []

        for grade in grades:
            submission = grade.submission
            student = submission.student if submission else None
            user = student.user if student else None
            assignment = submission.assignment if submission else None
            batch = assignment.course_batch if assignment else None
            course = batch.course if batch else None

            rows.append([
                grade.id,
                student.student_number if student else "",
                f"{user.first_name} {user.last_name}" if user else "",
                assignment.title if assignment else "",
                course.course_code if course else "",
                course.course_name if course else "",
                batch.batch_code if batch else "",
                grade.marks,
                assignment.max_marks if assignment else "",
                grade.status,
                grade.feedback or "",
                grade.graded_at.isoformat() if grade.graded_at else "",
                grade.published_at.isoformat() if grade.published_at else "",
            ])

        return headers, rows

    @staticmethod
    def grade_report(filters=None):
        headers, rows = AdminReportService.grade_report_data(filters)
        return AdminReportService.generate_csv(headers, rows)

    # -------------------------
    # Preview Dispatcher
    # -------------------------
    @staticmethod
    def get_report_preview(report_type, filters=None):
        report_map = {
            "students": AdminReportService.student_report_data,
            "enrollments": AdminReportService.enrollment_report_data,
            "course-applications": AdminReportService.course_application_report_data,
            "service-requests": AdminReportService.service_request_report_data,
            "submissions": AdminReportService.assignment_submission_report_data,
            "grades": AdminReportService.grade_report_data,
        }

        if report_type not in report_map:
            return None, "Invalid report type"

        headers, rows = report_map[report_type](filters)

        return AdminReportService.build_response(headers, rows), None

    @staticmethod
    def get_report_csv(report_type, filters=None):
        report_map = {
            "students": AdminReportService.student_report,
            "enrollments": AdminReportService.enrollment_report,
            "course-applications": AdminReportService.course_application_report,
            "service-requests": AdminReportService.service_request_report,
            "submissions": AdminReportService.assignment_submission_report,
            "grades": AdminReportService.grade_report,
        }

        if report_type not in report_map:
            return None, "Invalid report type"

        return report_map[report_type](filters), None