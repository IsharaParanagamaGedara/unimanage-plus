from app.models.course import Course
from app.models.course_batch import CourseBatch
from app.models.course_material import CourseMaterial
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission


class LecturerCourseService:

    @staticmethod
    def get_my_courses(user_id):
        courses = (
            Course.query
            .filter_by(lecturer_id=user_id)
            .order_by(Course.course_code.asc())
            .all()
        )

        return [
            LecturerCourseService.format_course(course)
            for course in courses
        ]

    @staticmethod
    def get_course_detail(user_id, course_id):
        course = Course.query.filter_by(
            id=course_id,
            lecturer_id=user_id
        ).first()

        if not course:
            return None, "Course not found or not assigned to you"

        return LecturerCourseService.format_course(course, include_details=True), None

    @staticmethod
    def format_course(course, include_details=False):
        batches = CourseBatch.query.filter_by(course_id=course.id).all()

        total_assignments = Assignment.query.join(CourseBatch).filter(
            CourseBatch.course_id == course.id
        ).count()

        total_submissions = (
            AssignmentSubmission.query
            .join(Assignment)
            .join(CourseBatch)
            .filter(CourseBatch.course_id == course.id)
            .count()
        )

        result = {
            "id": course.id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "description": course.description,
            "credits": course.credits,
            "capacity": course.capacity,
            "is_active": course.is_active,
            "department": {
                "id": course.department.id,
                "name": course.department.name,
                "code": course.department.code
            } if course.department else None,
            "summary": {
                "total_batches": len(batches),
                "active_batches": len([batch for batch in batches if batch.is_active]),
                "total_assignments": total_assignments,
                "total_submissions": total_submissions,
            }
        }

        if include_details:
            result["batches"] = [
                {
                    "id": batch.id,
                    "batch_code": batch.batch_code,
                    "batch_name": batch.batch_name,
                    "start_date": batch.start_date.isoformat() if batch.start_date else None,
                    "end_date": batch.end_date.isoformat() if batch.end_date else None,
                    "application_deadline": batch.application_deadline.isoformat()
                    if batch.application_deadline else None,
                    "capacity": batch.capacity,
                    "status": batch.status,
                    "is_active": batch.is_active,
                    "coordinator": {
                        "id": batch.coordinator.id,
                        "first_name": batch.coordinator.first_name,
                        "last_name": batch.coordinator.last_name,
                        "email": batch.coordinator.email,
                    } if batch.coordinator else None,
                }
                for batch in batches
            ]

            result["materials"] = [
                {
                    "id": material.id,
                    "title": material.title,
                    "description": material.description,
                    "file_name": material.file_name,
                    "file_type": material.file_type,
                    "file_size": material.file_size,
                    "file_size_mb": round(material.file_size / (1024 * 1024), 2)
                    if material.file_size else None,
                    "is_active": material.is_active,
                    "created_at": material.created_at.isoformat()
                    if material.created_at else None,
                }
                for material in CourseMaterial.query.filter_by(course_id=course.id)
                .order_by(CourseMaterial.created_at.desc())
                .all()
            ]

            result["assignments"] = [
                {
                    "id": assignment.id,
                    "title": assignment.title,
                    "due_date": assignment.due_date.isoformat()
                    if assignment.due_date else None,
                    "max_marks": assignment.max_marks,
                    "status": assignment.status,
                    "course_batch": {
                        "id": assignment.course_batch.id,
                        "batch_code": assignment.course_batch.batch_code,
                        "batch_name": assignment.course_batch.batch_name,
                    } if assignment.course_batch else None,
                    "submission_count": AssignmentSubmission.query.filter_by(
                        assignment_id=assignment.id
                    ).count()
                }
                for assignment in (
                    Assignment.query
                    .join(CourseBatch)
                    .filter(CourseBatch.course_id == course.id)
                    .order_by(Assignment.created_at.desc())
                    .all()
                )
            ]

        return result