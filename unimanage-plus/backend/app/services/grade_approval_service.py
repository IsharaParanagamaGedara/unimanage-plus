from datetime import datetime
from app.extensions import db
from app.models.grade import Grade
from app.models.audit_log import AuditLog


class GradeApprovalService:

    @staticmethod
    def get_pending_grades(user_id, role, batch_id=None, search=None):
        grades = (
            Grade.query
            .filter(Grade.status == "Pending Approval")
            .order_by(Grade.graded_at.desc())
            .all()
        )

        if role == "Department Staff":
            grades = [
                grade for grade in grades
                if grade.submission
                and grade.submission.assignment
                and grade.submission.assignment.course_batch
                and grade.submission.assignment.course_batch.coordinator_id == user_id
            ]

        if batch_id:
            grades = [
                grade for grade in grades
                if grade.submission
                and grade.submission.assignment
                and grade.submission.assignment.course_batch_id == int(batch_id)
            ]

        if search:
            search_lower = search.lower()

            grades = [
                grade for grade in grades
                if (
                    grade.submission
                    and grade.submission.assignment
                    and search_lower in grade.submission.assignment.title.lower()
                )
                or (
                    grade.submission
                    and grade.submission.student
                    and grade.submission.student.student_number
                    and search_lower in grade.submission.student.student_number.lower()
                )
                or (
                    grade.submission
                    and grade.submission.student
                    and grade.submission.student.user
                    and search_lower in grade.submission.student.user.first_name.lower()
                )
                or (
                    grade.submission
                    and grade.submission.student
                    and grade.submission.student.user
                    and search_lower in grade.submission.student.user.last_name.lower()
                )
            ]

        return [GradeApprovalService.format_grade(grade) for grade in grades]

    @staticmethod
    def publish_grade(grade_id, user_id, role, data):
        grade = Grade.query.get(grade_id)

        if not grade:
            return None, "Grade not found"

        access_error = GradeApprovalService.validate_grade_access(grade, user_id, role)

        if access_error:
            return None, access_error

        if grade.status != "Pending Approval":
            return None, "Only Pending Approval grades can be published"

        approval_note = data.get("approval_note", "").strip() if data else ""

        grade.status = "Published"
        grade.approval_note = approval_note
        grade.published_by = user_id
        grade.published_at = datetime.utcnow()

        grade.submission.status = "Grade Published"

        GradeApprovalService.create_audit_log(
            user_id,
            "PUBLISH_GRADE",
            f"Published grade #{grade.id} for submission #{grade.submission_id}"
        )

        db.session.commit()

        return GradeApprovalService.format_grade(grade), None

    @staticmethod
    def return_grade(grade_id, user_id, role, data):
        grade = Grade.query.get(grade_id)

        if not grade:
            return None, "Grade not found"

        access_error = GradeApprovalService.validate_grade_access(grade, user_id, role)

        if access_error:
            return None, access_error

        if grade.status != "Pending Approval":
            return None, "Only Pending Approval grades can be returned"

        approval_note = data.get("approval_note", "").strip() if data else ""

        if not approval_note:
            return None, "Return note is required"

        grade.status = "Draft"
        grade.approval_note = approval_note
        grade.published_by = None
        grade.published_at = None

        grade.submission.status = "Graded Draft"

        GradeApprovalService.create_audit_log(
            user_id,
            "RETURN_GRADE",
            f"Returned grade #{grade.id} to Draft"
        )

        db.session.commit()

        return GradeApprovalService.format_grade(grade), None

    @staticmethod
    def validate_grade_access(grade, user_id, role):
        if role == "Admin":
            return None

        if role == "Department Staff":
            batch = grade.submission.assignment.course_batch

            if batch.coordinator_id != user_id:
                return "Coordinator can review grades only for assigned batches"

            return None

        return "Admin or Course Coordinator access required"

    @staticmethod
    def format_grade(grade):
        submission = grade.submission
        assignment = submission.assignment if submission else None
        student = submission.student if submission else None
        student_user = student.user if student else None
        batch = assignment.course_batch if assignment else None
        course = batch.course if batch else None

        return {
            "id": grade.id,
            "submission_id": grade.submission_id,
            "graded_by": grade.graded_by,
            "marks": grade.marks,
            "feedback": grade.feedback,
            "status": grade.status,
            "approval_note": grade.approval_note,
            "published_by": grade.published_by,
            "published_at": grade.published_at.isoformat() if grade.published_at else None,
            "graded_at": grade.graded_at.isoformat() if grade.graded_at else None,

            "submission": {
                "id": submission.id,
                "submission_text": submission.submission_text,
                "file_name": submission.file_name,
                "submitted_at": submission.submitted_at.isoformat()
                if submission.submitted_at else None,
                "status": submission.status,
            } if submission else None,

            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "max_marks": assignment.max_marks,
                "due_date": assignment.due_date.isoformat()
                if assignment.due_date else None,
            } if assignment else None,

            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "first_name": student_user.first_name if student_user else None,
                "last_name": student_user.last_name if student_user else None,
                "email": student_user.email if student_user else None,
                "programme_name": student.programme_name,
                "year_of_study": student.year_of_study,
            } if student else None,

            "course_batch": {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
            } if batch else None,

            "course": {
                "id": course.id,
                "course_code": course.course_code,
                "course_name": course.course_name,
            } if course else None,

            "grader": {
                "id": grade.grader.id,
                "first_name": grade.grader.first_name,
                "last_name": grade.grader.last_name,
                "email": grade.grader.email,
            } if grade.grader else None,

            "publisher": {
                "id": grade.publisher.id,
                "first_name": grade.publisher.first_name,
                "last_name": grade.publisher.last_name,
                "email": grade.publisher.email,
            } if grade.publisher else None,
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )
        db.session.add(log)