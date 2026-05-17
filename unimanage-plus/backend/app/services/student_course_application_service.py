from datetime import date
from app.extensions import db
from app.models.user import User
from app.models.student import Student
from app.models.course import Course
from app.models.course_batch import CourseBatch
from app.models.course_application import CourseApplication
from app.models.batch_enrollment import BatchEnrollment
from app.models.audit_log import AuditLog


class StudentCourseApplicationService:

    @staticmethod
    def get_student_profile(user_id):
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return None, "Student profile not found"

        return student, None

    @staticmethod
    def get_available_batches(user_id, search=None):
        student, error = StudentCourseApplicationService.get_student_profile(user_id)

        if error:
            return None, error

        query = CourseBatch.query.filter(
            CourseBatch.is_active == True,
            CourseBatch.status == "Open",
            CourseBatch.application_deadline >= date.today()
        )

        if search:
            search_value = f"%{search}%"
            query = query.join(CourseBatch.course).filter(
                db.or_(
                    CourseBatch.batch_code.ilike(search_value),
                    CourseBatch.batch_name.ilike(search_value),
                    Course.course_code.ilike(search_value),
                    Course.course_name.ilike(search_value)
                )
            )

        batches = query.order_by(CourseBatch.application_deadline.asc()).all()

        return [
            StudentCourseApplicationService.format_available_batch(batch, student.id)
            for batch in batches
        ], None

    @staticmethod
    def apply_to_batch(user_id, data):
        student, error = StudentCourseApplicationService.get_student_profile(user_id)

        if error:
            return None, error

        batch_id = data.get("batch_id")
        application_note = data.get("application_note", "").strip()

        if not batch_id:
            return None, "Batch is required"

        batch = CourseBatch.query.get(batch_id)

        if not batch:
            return None, "Course batch not found"

        if not batch.is_active:
            return None, "Cannot apply to an inactive batch"

        if batch.status != "Open":
            return None, "This batch is not open for applications"

        if batch.application_deadline < date.today():
            return None, "Application deadline has passed"

        existing_application = CourseApplication.query.filter_by(
            student_id=student.id,
            batch_id=batch.id
        ).first()

        if existing_application:
            return None, "You have already applied to this batch"

        existing_enrollment = BatchEnrollment.query.filter_by(
            student_id=student.id,
            batch_id=batch.id
        ).first()

        if existing_enrollment:
            return None, "You are already enrolled in this batch"

        enrolled_count = BatchEnrollment.query.filter_by(
            batch_id=batch.id,
            enrollment_status="Active"
        ).count()

        if enrolled_count >= batch.capacity:
            return None, "This batch is already full"

        application = CourseApplication(
            student_id=student.id,
            batch_id=batch.id,
            status="Pending",
            application_note=application_note
        )

        db.session.add(application)
        db.session.flush()

        StudentCourseApplicationService.create_audit_log(
            user_id,
            "SUBMIT_COURSE_APPLICATION",
            f"Student applied to batch {batch.batch_code}"
        )

        db.session.commit()

        return StudentCourseApplicationService.format_application(application), None

    @staticmethod
    def get_my_applications(user_id):
        student, error = StudentCourseApplicationService.get_student_profile(user_id)

        if error:
            return None, error

        applications = (
            CourseApplication.query
            .filter_by(student_id=student.id)
            .order_by(CourseApplication.applied_at.desc())
            .all()
        )

        return [
            StudentCourseApplicationService.format_application(application)
            for application in applications
        ], None

    @staticmethod
    def format_available_batch(batch, student_id):
        enrolled_count = BatchEnrollment.query.filter_by(
            batch_id=batch.id,
            enrollment_status="Active"
        ).count()

        existing_application = CourseApplication.query.filter_by(
            student_id=student_id,
            batch_id=batch.id
        ).first()

        available_seats = batch.capacity - enrolled_count

        return {
            "id": batch.id,
            "batch_code": batch.batch_code,
            "batch_name": batch.batch_name,
            "start_date": batch.start_date.isoformat() if batch.start_date else None,
            "end_date": batch.end_date.isoformat() if batch.end_date else None,
            "application_deadline": batch.application_deadline.isoformat()
            if batch.application_deadline else None,
            "capacity": batch.capacity,
            "enrolled_count": enrolled_count,
            "available_seats": available_seats,
            "status": batch.status,
            "is_active": batch.is_active,
            "already_applied": existing_application is not None,
            "application_status": existing_application.status if existing_application else None,
            "course": {
                "id": batch.course.id,
                "course_code": batch.course.course_code,
                "course_name": batch.course.course_name,
                "description": batch.course.description,
                "credits": batch.course.credits,
                "department": {
                    "id": batch.course.department.id,
                    "name": batch.course.department.name,
                    "code": batch.course.department.code
                } if batch.course.department else None
            } if batch.course else None,
            "coordinator": {
                "id": batch.coordinator.id,
                "first_name": batch.coordinator.first_name,
                "last_name": batch.coordinator.last_name,
                "email": batch.coordinator.email
            } if batch.coordinator else None
        }

    @staticmethod
    def format_application(application):
        batch = application.batch

        return {
            "id": application.id,
            "student_id": application.student_id,
            "batch_id": application.batch_id,
            "status": application.status,
            "application_note": application.application_note,
            "review_note": application.review_note,
            "applied_at": application.applied_at.isoformat() if application.applied_at else None,
            "reviewed_at": application.reviewed_at.isoformat() if application.reviewed_at else None,
            "batch": {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
                "start_date": batch.start_date.isoformat() if batch.start_date else None,
                "end_date": batch.end_date.isoformat() if batch.end_date else None,
                "application_deadline": batch.application_deadline.isoformat()
                if batch.application_deadline else None,
                "course": {
                    "id": batch.course.id,
                    "course_code": batch.course.course_code,
                    "course_name": batch.course.course_name,
                    "credits": batch.course.credits
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