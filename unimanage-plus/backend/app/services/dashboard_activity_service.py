from app.models.user import User
from app.models.student import Student
from app.models.course_application import CourseApplication
from app.models.service_request import ServiceRequest
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.grade import Grade
from app.models.batch_enrollment import BatchEnrollment
from app.models.course_batch import CourseBatch
from app.models.notification import Notification


class DashboardActivityService:

    @staticmethod
    def get_admin_activity():
        return {
            "recent_users": [
                {
                    "id": user.id,
                    "name": f"{user.first_name} {user.last_name}",
                    "email": user.email,
                    "role": user.role.name if user.role else None,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                }
                for user in User.query.order_by(User.created_at.desc()).limit(5).all()
            ],

            "recent_applications": [
                DashboardActivityService.format_application(application)
                for application in CourseApplication.query
                .order_by(CourseApplication.applied_at.desc())
                .limit(5)
                .all()
            ],

            "recent_service_requests": [
                DashboardActivityService.format_service_request(request_item)
                for request_item in ServiceRequest.query
                .order_by(ServiceRequest.submitted_at.desc())
                .limit(5)
                .all()
            ],

            "recent_assignments": [
                DashboardActivityService.format_assignment(assignment)
                for assignment in Assignment.query
                .order_by(Assignment.created_at.desc())
                .limit(5)
                .all()
            ],
        }

    @staticmethod
    def get_lecturer_activity(user_id):
        assignment_ids = [
            assignment.id
            for assignment in Assignment.query.filter_by(created_by=user_id).all()
        ]

        return {
            "recent_submissions": [
                DashboardActivityService.format_submission(submission)
                for submission in AssignmentSubmission.query
                .filter(AssignmentSubmission.assignment_id.in_(assignment_ids))
                .order_by(AssignmentSubmission.submitted_at.desc())
                .limit(5)
                .all()
            ] if assignment_ids else [],

            "recent_draft_grades": [
                DashboardActivityService.format_grade(grade)
                for grade in Grade.query
                .join(AssignmentSubmission, Grade.submission_id == AssignmentSubmission.id)
                .filter(
                    AssignmentSubmission.assignment_id.in_(assignment_ids),
                    Grade.status == "Draft"
                )
                .order_by(Grade.graded_at.desc())
                .limit(5)
                .all()
            ] if assignment_ids else [],

            "recent_assignments": [
                DashboardActivityService.format_assignment(assignment)
                for assignment in Assignment.query
                .filter_by(created_by=user_id)
                .order_by(Assignment.created_at.desc())
                .limit(5)
                .all()
            ],
        }

    @staticmethod
    def get_student_activity(user_id):
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return {
                "recent_assignments": [],
                "recent_grades": [],
                "recent_notifications": [],
            }

        active_enrollments = BatchEnrollment.query.filter_by(
            student_id=student.id,
            enrollment_status="Active"
        ).all()

        batch_ids = [enrollment.batch_id for enrollment in active_enrollments]

        return {
            "recent_assignments": [
                DashboardActivityService.format_assignment(assignment)
                for assignment in Assignment.query
                .filter(
                    Assignment.course_batch_id.in_(batch_ids),
                    Assignment.status == "Published",
                    Assignment.is_active == True
                )
                .order_by(Assignment.published_at.desc())
                .limit(5)
                .all()
            ] if batch_ids else [],

            "recent_grades": [
                DashboardActivityService.format_grade(grade)
                for grade in Grade.query
                .join(AssignmentSubmission, Grade.submission_id == AssignmentSubmission.id)
                .filter(
                    AssignmentSubmission.student_id == student.id,
                    Grade.status == "Published"
                )
                .order_by(Grade.published_at.desc())
                .limit(5)
                .all()
            ],

            "recent_notifications": [
                {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "type": notification.type,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat()
                    if notification.created_at else None,
                }
                for notification in Notification.query
                .filter_by(user_id=user_id)
                .order_by(Notification.created_at.desc())
                .limit(5)
                .all()
            ],
        }

    @staticmethod
    def get_staff_activity(user_id):
        assigned_batches = CourseBatch.query.filter_by(coordinator_id=user_id).all()
        batch_ids = [batch.id for batch in assigned_batches]

        assignment_ids = [
            assignment.id
            for assignment in Assignment.query
            .filter(Assignment.course_batch_id.in_(batch_ids))
            .all()
        ] if batch_ids else []

        return {
            "recent_applications": [
                DashboardActivityService.format_application(application)
                for application in CourseApplication.query
                .filter(CourseApplication.batch_id.in_(batch_ids))
                .order_by(CourseApplication.applied_at.desc())
                .limit(5)
                .all()
            ] if batch_ids else [],

            "recent_grade_approvals": [
                DashboardActivityService.format_grade(grade)
                for grade in Grade.query
                .join(AssignmentSubmission, Grade.submission_id == AssignmentSubmission.id)
                .filter(AssignmentSubmission.assignment_id.in_(assignment_ids))
                .order_by(Grade.graded_at.desc())
                .limit(5)
                .all()
            ] if assignment_ids else [],

            "recent_service_requests": [
                DashboardActivityService.format_service_request(request_item)
                for request_item in ServiceRequest.query
                .filter_by(assigned_to=user_id)
                .order_by(ServiceRequest.submitted_at.desc())
                .limit(5)
                .all()
            ],
        }

    @staticmethod
    def format_application(application):
        student = application.student
        user = student.user if student else None
        batch = application.batch
        course = batch.course if batch else None

        return {
            "id": application.id,
            "student_name": f"{user.first_name} {user.last_name}" if user else None,
            "student_number": student.student_number if student else None,
            "course_code": course.course_code if course else None,
            "course_name": course.course_name if course else None,
            "batch_code": batch.batch_code if batch else None,
            "status": application.status,
            "applied_at": application.applied_at.isoformat()
            if application.applied_at else None,
        }

    @staticmethod
    def format_service_request(request_item):
        student = request_item.student
        user = student.user if student else None

        return {
            "id": request_item.id,
            "student_name": f"{user.first_name} {user.last_name}" if user else None,
            "request_type": request_item.request_type,
            "subject": request_item.subject,
            "priority": request_item.priority,
            "status": request_item.status,
            "submitted_at": request_item.submitted_at.isoformat()
            if request_item.submitted_at else None,
        }

    @staticmethod
    def format_assignment(assignment):
        batch = assignment.course_batch
        course = batch.course if batch else None

        return {
            "id": assignment.id,
            "title": assignment.title,
            "status": assignment.status,
            "course_code": course.course_code if course else None,
            "course_name": course.course_name if course else None,
            "batch_code": batch.batch_code if batch else None,
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
            "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
            "published_at": assignment.published_at.isoformat() if assignment.published_at else None,
        }

    @staticmethod
    def format_submission(submission):
        student = submission.student
        user = student.user if student else None
        assignment = submission.assignment

        return {
            "id": submission.id,
            "student_name": f"{user.first_name} {user.last_name}" if user else None,
            "student_number": student.student_number if student else None,
            "assignment_title": assignment.title if assignment else None,
            "status": submission.status,
            "submitted_at": submission.submitted_at.isoformat()
            if submission.submitted_at else None,
        }

    @staticmethod
    def format_grade(grade):
        submission = grade.submission
        student = submission.student if submission else None
        user = student.user if student else None
        assignment = submission.assignment if submission else None

        return {
            "id": grade.id,
            "student_name": f"{user.first_name} {user.last_name}" if user else None,
            "student_number": student.student_number if student else None,
            "assignment_title": assignment.title if assignment else None,
            "marks": grade.marks,
            "status": grade.status,
            "graded_at": grade.graded_at.isoformat() if grade.graded_at else None,
            "published_at": grade.published_at.isoformat() if grade.published_at else None,
        }