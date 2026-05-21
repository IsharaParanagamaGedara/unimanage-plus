from datetime import datetime
from app.extensions import db
from app.models.course_application import CourseApplication
from app.models.batch_enrollment import BatchEnrollment
from app.models.course_batch import CourseBatch
from app.models.audit_log import AuditLog
from app.models.user import User
from app.services.notification_service import NotificationService


class AdminCourseApplicationService:

    @staticmethod
    def get_applications(user_id, role, search=None, status=None, batch_id=None):
        query = CourseApplication.query.join(CourseBatch)

        if role == "Department Staff":
            query = query.filter(CourseBatch.coordinator_id == user_id)

        if status:
            query = query.filter(CourseApplication.status == status)

        if batch_id:
            query = query.filter(CourseApplication.batch_id == batch_id)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    CourseBatch.batch_code.ilike(search_value),
                    CourseBatch.batch_name.ilike(search_value)
                )
            )

        applications = query.order_by(CourseApplication.applied_at.desc()).all()

        return [
            AdminCourseApplicationService.format_application(application)
            for application in applications
        ]

    @staticmethod
    def review_application(application_id, data, reviewed_by_user_id, role):
        application = CourseApplication.query.get(application_id)

        if not application:
            return None, "Course application not found"

        batch = application.batch

        if role == "Department Staff" and batch.coordinator_id != reviewed_by_user_id:
            return None, "You can only review applications for your assigned batches"

        if application.status != "Pending":
            return None, "Only pending applications can be reviewed"

        decision = data.get("decision")
        review_note = data.get("review_note", "").strip()

        if decision not in ["Approved", "Rejected"]:
            return None, "Decision must be Approved or Rejected"

        if decision == "Approved":
            enrolled_count = BatchEnrollment.query.filter_by(
                batch_id=batch.id,
                enrollment_status="Active"
            ).count()

            if enrolled_count >= batch.capacity:
                return None, "Cannot approve application. Batch capacity is full"

            existing_enrollment = BatchEnrollment.query.filter_by(
                student_id=application.student_id,
                batch_id=batch.id
            ).first()

            if existing_enrollment:
                return None, "Student is already enrolled in this batch"

            enrollment = BatchEnrollment(
                student_id=application.student_id,
                batch_id=batch.id,
                application_id=application.id,
                enrollment_status="Active"
            )

            db.session.add(enrollment)

        application.status = decision
        application.review_note = review_note
        application.reviewed_by = reviewed_by_user_id
        application.reviewed_at = datetime.utcnow()

        if application.student and application.student.user_id:
            NotificationService.create_notification(
                user_id=application.student.user_id,
                title=f"Course Application {decision}",
                message=f"Your application for {batch.batch_code} - {batch.batch_name} has been {decision.lower()}.",
                notification_type="Course Application"
            )

        AdminCourseApplicationService.create_audit_log(
            reviewed_by_user_id,
            "REVIEW_COURSE_APPLICATION",
            f"{decision} application ID {application.id} for batch {batch.batch_code}"
        )

        db.session.commit()

        return AdminCourseApplicationService.format_application(application), None

    @staticmethod
    def format_application(application):
        batch = application.batch
        student = application.student
        user = student.user if student else None

        return {
            "id": application.id,
            "student_id": application.student_id,
            "batch_id": application.batch_id,
            "status": application.status,
            "application_note": application.application_note,
            "review_note": application.review_note,
            "applied_at": application.applied_at.isoformat() if application.applied_at else None,
            "reviewed_at": application.reviewed_at.isoformat() if application.reviewed_at else None,
            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
                "programme_name": student.programme_name,
                "year_of_study": student.year_of_study
            } if student else None,
            "batch": {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
                "capacity": batch.capacity,
                "start_date": batch.start_date.isoformat() if batch.start_date else None,
                "end_date": batch.end_date.isoformat() if batch.end_date else None,
                "course": {
                    "id": batch.course.id,
                    "course_code": batch.course.course_code,
                    "course_name": batch.course.course_name
                } if batch.course else None
            } if batch else None,
            "reviewer": {
                "id": application.reviewer.id,
                "first_name": application.reviewer.first_name,
                "last_name": application.reviewer.last_name,
                "email": application.reviewer.email
            } if application.reviewer else None
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )
        db.session.add(log)