from app.extensions import db
from app.models.user import User
from app.models.role import Role
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
    def get_overview():
        return {
            "kpis": AdminAnalyticsService.get_kpis(),
            "charts": {
                "applications_by_status": AdminAnalyticsService.count_by_status(
                    CourseApplication,
                    CourseApplication.status
                ),
                "service_requests_by_status": AdminAnalyticsService.count_by_status(
                    ServiceRequest,
                    ServiceRequest.status
                ),
                "assignments_by_status": AdminAnalyticsService.count_by_status(
                    Assignment,
                    Assignment.status
                ),
                "grades_by_status": AdminAnalyticsService.count_by_status(
                    Grade,
                    Grade.status
                ),
                "course_popularity": AdminAnalyticsService.get_course_popularity()
            }
        }

    @staticmethod
    def get_kpis():
        return {
            "total_students": Student.query.count(),
            "total_lecturers": Lecturer.query.count(),
            "total_courses": Course.query.count(),
            "total_batches": CourseBatch.query.count(),

            "pending_applications": CourseApplication.query.filter_by(
                status="Pending"
            ).count(),

            "approved_enrollments": BatchEnrollment.query.filter_by(
                enrollment_status="Active"
            ).count(),

            "pending_service_requests": ServiceRequest.query.filter_by(
                status="Pending"
            ).count(),

            "published_assignments": Assignment.query.filter_by(
                status="Published"
            ).count(),

            "total_submissions": AssignmentSubmission.query.count(),

            "published_grades": Grade.query.filter_by(
                status="Published"
            ).count(),
        }

    @staticmethod
    def count_by_status(model, status_column):
        results = (
            db.session.query(
                status_column.label("status"),
                db.func.count(model.id).label("count")
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
    def get_course_popularity():
        results = (
            db.session.query(
                Course.course_code,
                Course.course_name,
                db.func.count(BatchEnrollment.id).label("enrollment_count")
            )
            .join(CourseBatch, CourseBatch.course_id == Course.id)
            .outerjoin(BatchEnrollment, BatchEnrollment.batch_id == CourseBatch.id)
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