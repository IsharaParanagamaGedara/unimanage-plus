from app.models.user import User
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


class DashboardSummaryService:

    @staticmethod
    def get_admin_summary():
        return {
            "total_users": User.query.count(),
            "active_users": User.query.filter_by(is_active=True).count(),
            "total_students": Student.query.count(),
            "total_lecturers": Lecturer.query.count(),
            "total_courses": Course.query.count(),
            "total_batches": CourseBatch.query.count(),
            "pending_applications": CourseApplication.query.filter_by(status="Pending").count(),
            "active_enrollments": BatchEnrollment.query.filter_by(enrollment_status="Active").count(),
            "pending_service_requests": ServiceRequest.query.filter_by(status="Pending").count(),
            "published_assignments": Assignment.query.filter_by(status="Published").count(),
            "total_submissions": AssignmentSubmission.query.count(),
            "published_grades": Grade.query.filter_by(status="Published").count(),
        }

    @staticmethod
    def get_lecturer_summary(user_id):
        my_assignments = Assignment.query.filter_by(created_by=user_id)

        assignment_ids = [assignment.id for assignment in my_assignments.all()]

        return {
            "my_assignments": len(assignment_ids),
            "published_assignments": Assignment.query.filter(
                Assignment.id.in_(assignment_ids),
                Assignment.status == "Published"
            ).count() if assignment_ids else 0,
            "total_submissions": AssignmentSubmission.query.filter(
                AssignmentSubmission.assignment_id.in_(assignment_ids)
            ).count() if assignment_ids else 0,
            "draft_grades": Grade.query.join(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id.in_(assignment_ids),
                Grade.status == "Draft"
            ).count() if assignment_ids else 0,
            "pending_approval_grades": Grade.query.join(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id.in_(assignment_ids),
                Grade.status == "Pending Approval"
            ).count() if assignment_ids else 0,
            "published_grades": Grade.query.join(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id.in_(assignment_ids),
                Grade.status == "Published"
            ).count() if assignment_ids else 0,
        }

    @staticmethod
    def get_student_summary(user_id):
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return {
                "my_applications": 0,
                "active_enrollments": 0,
                "available_assignments": 0,
                "my_submissions": 0,
                "published_grades": 0,
                "service_requests": 0,
                "pending_service_requests": 0,
            }

        active_enrollments = BatchEnrollment.query.filter_by(
            student_id=student.id,
            enrollment_status="Active"
        ).all()

        batch_ids = [enrollment.batch_id for enrollment in active_enrollments]

        return {
            "my_applications": CourseApplication.query.filter_by(student_id=student.id).count(),
            "active_enrollments": len(batch_ids),
            "available_assignments": Assignment.query.filter(
                Assignment.course_batch_id.in_(batch_ids),
                Assignment.status == "Published",
                Assignment.is_active == True
            ).count() if batch_ids else 0,
            "my_submissions": AssignmentSubmission.query.filter_by(student_id=student.id).count(),
            "published_grades": Grade.query.join(AssignmentSubmission).filter(
                AssignmentSubmission.student_id == student.id,
                Grade.status == "Published"
            ).count(),
            "service_requests": ServiceRequest.query.filter_by(student_id=student.id).count(),
            "pending_service_requests": ServiceRequest.query.filter_by(
                student_id=student.id,
                status="Pending"
            ).count(),
        }

    @staticmethod
    def get_staff_summary(user_id):
        assigned_batches = CourseBatch.query.filter_by(coordinator_id=user_id).all()
        batch_ids = [batch.id for batch in assigned_batches]

        assignment_ids = [
            assignment.id
            for assignment in Assignment.query.filter(
                Assignment.course_batch_id.in_(batch_ids)
            ).all()
        ] if batch_ids else []

        return {
            "assigned_batches": len(batch_ids),
            "pending_applications": CourseApplication.query.filter(
                CourseApplication.batch_id.in_(batch_ids),
                CourseApplication.status == "Pending"
            ).count() if batch_ids else 0,
            "active_enrollments": BatchEnrollment.query.filter(
                BatchEnrollment.batch_id.in_(batch_ids),
                BatchEnrollment.enrollment_status == "Active"
            ).count() if batch_ids else 0,
            "pending_assignment_reviews": Assignment.query.filter(
                Assignment.course_batch_id.in_(batch_ids),
                Assignment.status == "Pending Review"
            ).count() if batch_ids else 0,
            "pending_grade_approvals": Grade.query.join(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id.in_(assignment_ids),
                Grade.status == "Pending Approval"
            ).count() if assignment_ids else 0,
            "assigned_service_requests": ServiceRequest.query.filter_by(
                assigned_to=user_id
            ).count(),
            "pending_service_requests": ServiceRequest.query.filter_by(
                assigned_to=user_id,
                status="Pending"
            ).count(),
        }