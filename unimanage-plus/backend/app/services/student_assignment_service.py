import os
import time
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app
from app.extensions import db
from app.models.student import Student
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.batch_enrollment import BatchEnrollment
from app.models.audit_log import AuditLog

ALLOWED_EXTENSIONS = {"pdf", "docx", "zip"}


class StudentAssignmentService:

    @staticmethod
    def allowed_file(filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def get_student_profile(user_id):
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return None, "Student profile not found"

        return student, None

    @staticmethod
    def get_my_assignments(user_id, search=None):
        student, error = StudentAssignmentService.get_student_profile(user_id)

        if error:
            return None, error

        enrolled_batch_ids = [
            enrollment.batch_id
            for enrollment in BatchEnrollment.query.filter_by(
                student_id=student.id,
                enrollment_status="Active"
            ).all()
        ]

        if not enrolled_batch_ids:
            return [], None

        query = Assignment.query.filter(
            Assignment.course_batch_id.in_(enrolled_batch_ids),
            Assignment.status == "Published",
            Assignment.is_active == True
        )

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    Assignment.title.ilike(search_value),
                    Assignment.description.ilike(search_value),
                    Assignment.instructions.ilike(search_value)
                )
            )

        assignments = query.order_by(Assignment.due_date.asc()).all()

        return [
            StudentAssignmentService.format_assignment(assignment, student.id)
            for assignment in assignments
        ], None

    @staticmethod
    def get_assignment_detail(user_id, assignment_id):
        student, error = StudentAssignmentService.get_student_profile(user_id)

        if error:
            return None, error

        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        if assignment.status != "Published" or not assignment.is_active:
            return None, "Assignment is not available"

        enrolled = BatchEnrollment.query.filter_by(
            student_id=student.id,
            batch_id=assignment.course_batch_id,
            enrollment_status="Active"
        ).first()

        if not enrolled:
            return None, "You are not enrolled in this assignment batch"

        return StudentAssignmentService.format_assignment(
            assignment,
            student.id,
            include_submission=True
        ), None

    @staticmethod
    def submit_assignment(user_id, assignment_id, form_data, file=None):
        student, error = StudentAssignmentService.get_student_profile(user_id)

        if error:
            return None, error

        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        if assignment.status != "Published" or not assignment.is_active:
            return None, "Only published assignments can be submitted"

        if assignment.due_date <= datetime.utcnow():
            return None, "Submission deadline has passed"

        enrolled = BatchEnrollment.query.filter_by(
            student_id=student.id,
            batch_id=assignment.course_batch_id,
            enrollment_status="Active"
        ).first()

        if not enrolled:
            return None, "You can submit only for assignments in your enrolled batches"

        existing_submission = AssignmentSubmission.query.filter_by(
            assignment_id=assignment.id,
            student_id=student.id
        ).first()

        if existing_submission:
            return None, "You have already submitted this assignment"

        submission_text = form_data.get("submission_text", "").strip()

        if not submission_text and (not file or file.filename == ""):
            return None, "Submission text or file is required"

        file_data, file_error = StudentAssignmentService.save_submission_file(file)

        if file_error:
            return None, file_error

        submission = AssignmentSubmission(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_text=submission_text,
            status="Submitted",
            **file_data
        )

        db.session.add(submission)
        db.session.flush()

        StudentAssignmentService.create_audit_log(
            user_id,
            "SUBMIT_ASSIGNMENT",
            f"Submitted assignment '{assignment.title}'"
        )

        db.session.commit()

        return StudentAssignmentService.format_submission(submission), None

    @staticmethod
    def get_my_submissions(user_id):
        student, error = StudentAssignmentService.get_student_profile(user_id)

        if error:
            return None, error

        submissions = (
            AssignmentSubmission.query
            .filter_by(student_id=student.id)
            .order_by(AssignmentSubmission.submitted_at.desc())
            .all()
        )

        return [
            StudentAssignmentService.format_submission(submission)
            for submission in submissions
        ], None

    @staticmethod
    def save_submission_file(file):
        empty_data = {
            "file_path": None,
            "file_name": None,
            "file_type": None,
            "file_size": None
        }

        if not file or file.filename == "":
            return empty_data, None

        if not StudentAssignmentService.allowed_file(file.filename):
            return None, "Invalid file type. Allowed: PDF, DOCX, ZIP"

        upload_folder = current_app.config["ASSIGNMENT_SUBMISSION_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)

        original_filename = secure_filename(file.filename)
        file_type = original_filename.rsplit(".", 1)[1].lower()
        saved_filename = f"submission_{int(time.time())}_{original_filename}"
        saved_path = os.path.join(upload_folder, saved_filename)

        file.save(saved_path)

        file_size = os.path.getsize(saved_path)

        return {
            "file_path": saved_path,
            "file_name": original_filename,
            "file_type": file_type,
            "file_size": file_size
        }, None

    @staticmethod
    def format_assignment(assignment, student_id, include_submission=False):
        batch = assignment.course_batch
        course = batch.course if batch else None

        result = {
            "id": assignment.id,
            "course_batch_id": assignment.course_batch_id,
            "title": assignment.title,
            "description": assignment.description,
            "instructions": assignment.instructions,
            "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
            "max_marks": assignment.max_marks,
            "attachment_name": assignment.attachment_name,
            "attachment_type": assignment.attachment_type,
            "attachment_size": assignment.attachment_size,
            "attachment_size_mb": round(assignment.attachment_size / (1024 * 1024), 2)
            if assignment.attachment_size else None,
            "status": assignment.status,
            "published_at": assignment.published_at.isoformat()
            if assignment.published_at else None,
            "course_batch": {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
                "course": {
                    "id": course.id,
                    "course_code": course.course_code,
                    "course_name": course.course_name,
                    "credits": course.credits
                } if course else None
            } if batch else None,
            "already_submitted": AssignmentSubmission.query.filter_by(
                assignment_id=assignment.id,
                student_id=student_id
            ).first() is not None,
            "is_overdue": assignment.due_date <= datetime.utcnow()
            if assignment.due_date else False
        }

        if include_submission:
            submission = AssignmentSubmission.query.filter_by(
                assignment_id=assignment.id,
                student_id=student_id
            ).first()

            result["submission"] = (
                StudentAssignmentService.format_submission(submission)
                if submission else None
            )

        return result

    @staticmethod
    def format_submission(submission):
        assignment = submission.assignment
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
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "due_date": assignment.due_date.isoformat()
                if assignment.due_date else None,
                "max_marks": assignment.max_marks,
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
            "grade": {
                "id": grade.id,
                "marks": grade.marks,
                "feedback": grade.feedback,
                "status": grade.status,
                "published_at": grade.published_at.isoformat()
                if grade.published_at else None
            } if grade and grade.status == "Published" else None
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )
        db.session.add(log)