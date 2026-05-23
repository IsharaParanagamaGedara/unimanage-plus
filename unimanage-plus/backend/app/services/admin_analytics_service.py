from datetime import datetime
from app.extensions import db
from app.models.student import Student
from app.models.lecturer import Lecturer
from app.models.course import Course
from app.models.course_batch import CourseBatch
from app.models.course_application import CourseApplication
from app.models.batch_enrollment import BatchEnrollment
from app.models.service_request import ServiceRequest
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.grade import Grade


class AdminAnalyticsService:

    @staticmethod
    def parse_date(value):
        if not value:
            return None

        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return None

    @staticmethod
    def get_filter_value(filters, key):
        value = filters.get(key) if filters else None
        return int(value) if value else None

    @staticmethod
    def apply_date_filter(query, column, filters):
        start_date = AdminAnalyticsService.parse_date(filters.get("start_date"))
        end_date = AdminAnalyticsService.parse_date(filters.get("end_date"))
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
    def get_overview(filters=None):
        filters = filters or {}

        return {
            "kpis": AdminAnalyticsService.get_kpis(filters),
            "charts": {
                "applications_by_status": AdminAnalyticsService.get_applications_by_status(filters),
                "service_requests_by_status": AdminAnalyticsService.get_service_requests_by_status(filters),
                "assignments_by_status": AdminAnalyticsService.get_assignments_by_status(filters),
                "grades_by_status": AdminAnalyticsService.get_grades_by_status(filters),
                "course_popularity": AdminAnalyticsService.get_course_popularity(filters),
            }
        }

    @staticmethod
    def get_kpis(filters=None):
        filters = filters or {}

        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        students_query = Student.query
        lecturers_query = Lecturer.query
        courses_query = Course.query
        batches_query = CourseBatch.query
        applications_query = CourseApplication.query
        enrollments_query = BatchEnrollment.query
        service_requests_query = ServiceRequest.query
        assignments_query = Assignment.query
        submissions_query = AssignmentSubmission.query
        grades_query = Grade.query

        if department_id:
            students_query = students_query.filter(Student.department_id == department_id)
            lecturers_query = lecturers_query.filter(Lecturer.department_id == department_id)
            courses_query = courses_query.filter(Course.department_id == department_id)
            batches_query = batches_query.join(Course, CourseBatch.course_id == Course.id).filter(
                Course.department_id == department_id
            )

        if course_id:
            courses_query = courses_query.filter(Course.id == course_id)
            batches_query = batches_query.filter(CourseBatch.course_id == course_id)

        if batch_id:
            batches_query = batches_query.filter(CourseBatch.id == batch_id)

        applications_query = AdminAnalyticsService.filter_applications_scope(applications_query, filters)
        enrollments_query = AdminAnalyticsService.filter_enrollments_scope(enrollments_query, filters)
        service_requests_query = AdminAnalyticsService.filter_service_requests_scope(service_requests_query, filters)
        assignments_query = AdminAnalyticsService.filter_assignments_scope(assignments_query, filters)
        submissions_query = AdminAnalyticsService.filter_submissions_scope(submissions_query, filters)
        grades_query = AdminAnalyticsService.filter_grades_scope(grades_query, filters)

        applications_query = AdminAnalyticsService.apply_date_filter(
            applications_query,
            CourseApplication.applied_at,
            filters
        )

        enrollments_query = AdminAnalyticsService.apply_date_filter(
            enrollments_query,
            BatchEnrollment.enrolled_at,
            filters
        )

        service_requests_query = AdminAnalyticsService.apply_date_filter(
            service_requests_query,
            ServiceRequest.submitted_at,
            filters
        )

        assignments_query = AdminAnalyticsService.apply_date_filter(
            assignments_query,
            Assignment.created_at,
            filters
        )

        submissions_query = AdminAnalyticsService.apply_date_filter(
            submissions_query,
            AssignmentSubmission.submitted_at,
            filters
        )

        grades_query = AdminAnalyticsService.apply_date_filter(
            grades_query,
            Grade.graded_at,
            filters
        )

        return {
            "total_students": students_query.count(),
            "total_lecturers": lecturers_query.count(),
            "total_courses": courses_query.count(),
            "total_batches": batches_query.count(),

            "pending_applications": applications_query.filter(
                CourseApplication.status == "Pending"
            ).count(),

            "approved_enrollments": enrollments_query.filter(
                BatchEnrollment.enrollment_status == "Active"
            ).count(),

            "pending_service_requests": service_requests_query.filter(
                ServiceRequest.status == "Pending"
            ).count(),

            "published_assignments": assignments_query.filter(
                Assignment.status == "Published"
            ).count(),

            "total_submissions": submissions_query.count(),

            "published_grades": grades_query.filter(
                Grade.status == "Published"
            ).count(),
        }

    @staticmethod
    def filter_applications_scope(query, filters):
        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        if batch_id:
            return query.filter(CourseApplication.batch_id == batch_id)

        if course_id or department_id:
            query = query.join(CourseBatch, CourseApplication.batch_id == CourseBatch.id)

            if course_id:
                query = query.filter(CourseBatch.course_id == course_id)

            if department_id:
                query = query.join(Course, CourseBatch.course_id == Course.id)
                query = query.filter(Course.department_id == department_id)

        return query

    @staticmethod
    def filter_enrollments_scope(query, filters):
        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        if batch_id:
            return query.filter(BatchEnrollment.batch_id == batch_id)

        if course_id or department_id:
            query = query.join(CourseBatch, BatchEnrollment.batch_id == CourseBatch.id)

            if course_id:
                query = query.filter(CourseBatch.course_id == course_id)

            if department_id:
                query = query.join(Course, CourseBatch.course_id == Course.id)
                query = query.filter(Course.department_id == department_id)

        return query

    @staticmethod
    def filter_assignments_scope(query, filters):
        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        if batch_id:
            return query.filter(Assignment.course_batch_id == batch_id)

        if course_id or department_id:
            query = query.join(CourseBatch, Assignment.course_batch_id == CourseBatch.id)

            if course_id:
                query = query.filter(CourseBatch.course_id == course_id)

            if department_id:
                query = query.join(Course, CourseBatch.course_id == Course.id)
                query = query.filter(Course.department_id == department_id)

        return query

    @staticmethod
    def filter_submissions_scope(query, filters):
        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        if department_id or course_id or batch_id:
            query = query.join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)

            if batch_id:
                return query.filter(Assignment.course_batch_id == batch_id)

            query = query.join(CourseBatch, Assignment.course_batch_id == CourseBatch.id)

            if course_id:
                query = query.filter(CourseBatch.course_id == course_id)

            if department_id:
                query = query.join(Course, CourseBatch.course_id == Course.id)
                query = query.filter(Course.department_id == department_id)

        return query

    @staticmethod
    def filter_grades_scope(query, filters):
        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        if department_id or course_id or batch_id:
            query = query.join(AssignmentSubmission, Grade.submission_id == AssignmentSubmission.id)
            query = query.join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)

            if batch_id:
                return query.filter(Assignment.course_batch_id == batch_id)

            query = query.join(CourseBatch, Assignment.course_batch_id == CourseBatch.id)

            if course_id:
                query = query.filter(CourseBatch.course_id == course_id)

            if department_id:
                query = query.join(Course, CourseBatch.course_id == Course.id)
                query = query.filter(Course.department_id == department_id)

        return query

    @staticmethod
    def filter_service_requests_scope(query, filters):
        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")

        if department_id:
            query = query.join(Student, ServiceRequest.student_id == Student.id)
            query = query.filter(Student.department_id == department_id)

        return query

    @staticmethod
    def get_applications_by_status(filters):
        query = CourseApplication.query
        query = AdminAnalyticsService.filter_applications_scope(query, filters)
        query = AdminAnalyticsService.apply_date_filter(query, CourseApplication.applied_at, filters)

        return AdminAnalyticsService.count_query_by_status(
            query,
            CourseApplication.status,
            CourseApplication.id
        )

    @staticmethod
    def get_service_requests_by_status(filters):
        query = ServiceRequest.query
        query = AdminAnalyticsService.filter_service_requests_scope(query, filters)
        query = AdminAnalyticsService.apply_date_filter(query, ServiceRequest.submitted_at, filters)

        return AdminAnalyticsService.count_query_by_status(
            query,
            ServiceRequest.status,
            ServiceRequest.id
        )

    @staticmethod
    def get_assignments_by_status(filters):
        query = Assignment.query
        query = AdminAnalyticsService.filter_assignments_scope(query, filters)
        query = AdminAnalyticsService.apply_date_filter(query, Assignment.created_at, filters)

        return AdminAnalyticsService.count_query_by_status(
            query,
            Assignment.status,
            Assignment.id
        )

    @staticmethod
    def get_grades_by_status(filters):
        query = Grade.query
        query = AdminAnalyticsService.filter_grades_scope(query, filters)
        query = AdminAnalyticsService.apply_date_filter(query, Grade.graded_at, filters)

        return AdminAnalyticsService.count_query_by_status(
            query,
            Grade.status,
            Grade.id
        )

    @staticmethod
    def count_query_by_status(query, status_column, id_column):
        results = (
            query.with_entities(
                status_column.label("status"),
                db.func.count(id_column).label("count")
            )
            .group_by(status_column)
            .all()
        )

        return [
            {
                "status": status,
                "count": count
            }
            for status, count in results
        ]

    @staticmethod
    def get_course_popularity(filters=None):
        filters = filters or {}

        department_id = AdminAnalyticsService.get_filter_value(filters, "department_id")
        course_id = AdminAnalyticsService.get_filter_value(filters, "course_id")
        batch_id = AdminAnalyticsService.get_filter_value(filters, "batch_id")

        query = (
            db.session.query(
                Course.course_code,
                Course.course_name,
                db.func.count(BatchEnrollment.id).label("enrollment_count")
            )
            .join(CourseBatch, CourseBatch.course_id == Course.id)
            .outerjoin(BatchEnrollment, BatchEnrollment.batch_id == CourseBatch.id)
        )

        if department_id:
            query = query.filter(Course.department_id == department_id)

        if course_id:
            query = query.filter(Course.id == course_id)

        if batch_id:
            query = query.filter(CourseBatch.id == batch_id)

        query = AdminAnalyticsService.apply_date_filter(
            query,
            BatchEnrollment.enrolled_at,
            filters
        )

        results = (
            query
            .group_by(Course.id, Course.course_code, Course.course_name)
            .order_by(db.func.count(BatchEnrollment.id).desc())
            .limit(10)
            .all()
        )

        return [
            {
                "course_code": course_code,
                "course_name": course_name,
                "enrollment_count": enrollment_count
            }
            for course_code, course_name, enrollment_count in results
        ]