from app.models.student import Student
from app.models.batch_enrollment import BatchEnrollment


class StudentEnrollmentService:

    @staticmethod
    def get_student_profile(user_id):
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return None, "Student profile not found"

        return student, None

    @staticmethod
    def get_my_enrollments(user_id):
        student, error = StudentEnrollmentService.get_student_profile(user_id)

        if error:
            return None, error

        enrollments = (
            BatchEnrollment.query
            .filter_by(student_id=student.id)
            .order_by(BatchEnrollment.enrolled_at.desc())
            .all()
        )

        return [
            StudentEnrollmentService.format_enrollment(enrollment)
            for enrollment in enrollments
        ], None

    @staticmethod
    def format_enrollment(enrollment):
        batch = enrollment.batch

        return {
            "id": enrollment.id,
            "student_id": enrollment.student_id,
            "batch_id": enrollment.batch_id,
            "application_id": enrollment.application_id,
            "enrollment_status": enrollment.enrollment_status,
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "batch": {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
                "start_date": batch.start_date.isoformat() if batch.start_date else None,
                "end_date": batch.end_date.isoformat() if batch.end_date else None,
                "course": {
                    "id": batch.course.id,
                    "course_code": batch.course.course_code,
                    "course_name": batch.course.course_name,
                    "credits": batch.course.credits,
                    "description": batch.course.description,
                } if batch.course else None,
                "coordinator": {
                    "id": batch.coordinator.id,
                    "first_name": batch.coordinator.first_name,
                    "last_name": batch.coordinator.last_name,
                    "email": batch.coordinator.email,
                } if batch.coordinator else None,
            } if batch else None
        }