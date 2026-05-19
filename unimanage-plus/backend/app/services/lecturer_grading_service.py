from datetime import datetime
from app.extensions import db
from app.models.assignment_submission import AssignmentSubmission
from app.models.assignment import Assignment
from app.models.grade import Grade
from app.models.audit_log import AuditLog


class LecturerGradingService:

    @staticmethod
    def get_submissions(user_id, role, assignment_id=None, batch_id=None, search=None):
        query = AssignmentSubmission.query.join(Assignment)

        if role == "Lecturer":
            query = query.filter(Assignment.created_by == user_id)

        if assignment_id:
            query = query.filter(AssignmentSubmission.assignment_id == assignment_id)

        if batch_id:
            query = query.filter(Assignment.course_batch_id == batch_id)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    Assignment.title.ilike(search_value),
                    AssignmentSubmission.submission_text.ilike(search_value)
                )
            )

        submissions = query.order_by(AssignmentSubmission.submitted_at.desc()).all()

        return [
            LecturerGradingService.format_submission(submission)
            for submission in submissions
        ]

    @staticmethod
    def get_submission_by_id(submission_id, user_id, role):
        submission = AssignmentSubmission.query.get(submission_id)

        if not submission:
            return None, "Submission not found"

        access_error = LecturerGradingService.validate_submission_access(
            submission,
            user_id,
            role
        )

        if access_error:
            return None, access_error

        return LecturerGradingService.format_submission(submission, include_grade=True), None

    @staticmethod
    def create_grade(submission_id, user_id, role, data):
        submission = AssignmentSubmission.query.get(submission_id)

        if not submission:
            return None, "Submission not found"

        access_error = LecturerGradingService.validate_submission_access(
            submission,
            user_id,
            role
        )

        if access_error:
            return None, access_error

        existing_grade = Grade.query.filter_by(submission_id=submission.id).first()

        if existing_grade:
            return None, "This submission already has a grade"

        marks = data.get("marks")
        feedback = data.get("feedback", "").strip()

        validation_error = LecturerGradingService.validate_grade_data(
            marks=marks,
            max_marks=submission.assignment.max_marks
        )

        if validation_error:
            return None, validation_error

        grade = Grade(
            submission_id=submission.id,
            graded_by=user_id,
            marks=float(marks),
            feedback=feedback,
            status="Draft",
            graded_at=datetime.utcnow()
        )

        db.session.add(grade)

        submission.status = "Graded Draft"

        LecturerGradingService.create_audit_log(
            user_id,
            "CREATE_DRAFT_GRADE",
            f"Created draft grade for submission #{submission.id}"
        )

        db.session.commit()

        return LecturerGradingService.format_grade(grade), None

    @staticmethod
    def update_grade(grade_id, user_id, role, data):
        grade = Grade.query.get(grade_id)

        if not grade:
            return None, "Grade not found"

        submission = grade.submission

        access_error = LecturerGradingService.validate_submission_access(
            submission,
            user_id,
            role
        )

        if access_error:
            return None, access_error

        if grade.status != "Draft":
            return None, "Only Draft grades can be edited"

        marks = data.get("marks", grade.marks)
        feedback = data.get("feedback", grade.feedback or "").strip()

        validation_error = LecturerGradingService.validate_grade_data(
            marks=marks,
            max_marks=submission.assignment.max_marks
        )

        if validation_error:
            return None, validation_error

        grade.marks = float(marks)
        grade.feedback = feedback
        grade.graded_at = datetime.utcnow()

        LecturerGradingService.create_audit_log(
            user_id,
            "UPDATE_DRAFT_GRADE",
            f"Updated draft grade #{grade.id}"
        )

        db.session.commit()

        return LecturerGradingService.format_grade(grade), None

    @staticmethod
    def submit_grade_for_approval(grade_id, user_id, role):
        grade = Grade.query.get(grade_id)

        if not grade:
            return None, "Grade not found"

        submission = grade.submission

        access_error = LecturerGradingService.validate_submission_access(
            submission,
            user_id,
            role
        )

        if access_error:
            return None, access_error

        if grade.status != "Draft":
            return None, "Only Draft grades can be submitted for approval"

        grade.status = "Pending Approval"
        submission.status = "Grade Pending Approval"

        LecturerGradingService.create_audit_log(
            user_id,
            "SUBMIT_GRADE_APPROVAL",
            f"Submitted grade #{grade.id} for approval"
        )

        db.session.commit()

        return LecturerGradingService.format_grade(grade), None

    @staticmethod
    def validate_submission_access(submission, user_id, role):
        assignment = submission.assignment

        if role == "Admin":
            return None

        if role == "Lecturer":
            if assignment.created_by != user_id:
                return "Lecturer can access only submissions for their own assignments"
            return None

        return "Lecturer or Admin access required"

    @staticmethod
    def validate_grade_data(marks, max_marks):
        if marks is None:
            return "Marks are required"

        try:
            marks_value = float(marks)
        except ValueError:
            return "Marks must be a valid number"

        if marks_value < 0:
            return "Marks cannot be negative"

        if marks_value > float(max_marks):
            return "Marks cannot exceed assignment max marks"

        return None

    @staticmethod
    def format_submission(submission, include_grade=True):
        assignment = submission.assignment
        student = submission.student
        student_user = student.user if student else None
        batch = assignment.course_batch if assignment else None
        course = batch.course if batch else None
        grade = submission.grade

        return {
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "student_id": submission.student_id,
            "submission_text": submission.submission_text,
            "file_name": submission.file_name,
            "file_type": submission.file_type,
            "file_size": submission.file_size,
            "file_size_mb": round(submission.file_size / (1024 * 1024), 2)
            if submission.file_size else None,
            "submitted_at": submission.submitted_at.isoformat()
            if submission.submitted_at else None,
            "status": submission.status,
            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "first_name": student_user.first_name if student_user else None,
                "last_name": student_user.last_name if student_user else None,
                "email": student_user.email if student_user else None,
                "programme_name": student.programme_name,
                "year_of_study": student.year_of_study,
            } if student else None,
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "max_marks": assignment.max_marks,
                "due_date": assignment.due_date.isoformat()
                if assignment.due_date else None,
                "course_batch": {
                    "id": batch.id,
                    "batch_code": batch.batch_code,
                    "batch_name": batch.batch_name,
                    "course": {
                        "id": course.id,
                        "course_code": course.course_code,
                        "course_name": course.course_name
                    } if course else None
                } if batch else None
            } if assignment else None,
            "grade": LecturerGradingService.format_grade(grade)
            if include_grade and grade else None
        }

    @staticmethod
    def format_grade(grade):
        return {
            "id": grade.id,
            "submission_id": grade.submission_id,
            "graded_by": grade.graded_by,
            "marks": grade.marks,
            "feedback": grade.feedback,
            "status": grade.status,
            "approval_note": grade.approval_note,
            "published_by": grade.published_by,
            "published_at": grade.published_at.isoformat()
            if grade.published_at else None,
            "graded_at": grade.graded_at.isoformat()
            if grade.graded_at else None,
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