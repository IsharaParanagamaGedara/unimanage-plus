import os
import time
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app
from app.extensions import db
from app.models.assignment import Assignment
from app.models.course_batch import CourseBatch
from app.models.batch_enrollment import BatchEnrollment
from app.models.audit_log import AuditLog
from app.services.notification_service import NotificationService

ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "zip"}


class AssignmentService:

    @staticmethod
    def allowed_file(filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def get_assignments(user_id, role, status=None, batch_id=None, search=None):
        query = Assignment.query.join(CourseBatch)

        if role == "Lecturer":
            query = query.filter(
                db.or_(
                    Assignment.created_by == user_id,
                    CourseBatch.course.has(lecturer_id=user_id)
                )
            )

        elif role == "Department Staff":
            query = query.filter(CourseBatch.coordinator_id == user_id)

        if status:
            query = query.filter(Assignment.status == status)

        if batch_id:
            query = query.filter(Assignment.course_batch_id == batch_id)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    Assignment.title.ilike(search_value),
                    Assignment.description.ilike(search_value),
                    CourseBatch.batch_code.ilike(search_value),
                    CourseBatch.batch_name.ilike(search_value)
                )
            )

        assignments = query.order_by(Assignment.created_at.desc()).all()

        return [AssignmentService.format_assignment(a) for a in assignments]

    @staticmethod
    def get_assignment_by_id(assignment_id, user_id, role):
        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        access_error = AssignmentService.validate_assignment_access(assignment, user_id, role)

        if access_error:
            return None, access_error

        return AssignmentService.format_assignment(assignment), None

    @staticmethod
    def create_assignment(user_id, role, form_data, file=None):
        if role not in ["Admin", "Lecturer"]:
            return None, "Only Lecturer or Admin can create assignments"

        batch_id = form_data.get("course_batch_id")
        title = form_data.get("title", "").strip()
        description = form_data.get("description", "").strip()
        instructions = form_data.get("instructions", "").strip()
        due_date = form_data.get("due_date", "").strip()
        max_marks = form_data.get("max_marks")

        if not batch_id:
            return None, "Course batch is required"

        batch = CourseBatch.query.get(batch_id)

        if not batch:
            return None, "Course batch not found"

        if not batch.is_active:
            return None, "Cannot create assignment for inactive batch"

        if role == "Lecturer":
            if not batch.course or batch.course.lecturer_id != user_id:
                return None, "Lecturer can create assignments only for assigned course batches"

        if not title:
            return None, "Assignment title is required"

        if not instructions:
            return None, "Assignment instructions are required"

        try:
            parsed_due_date = datetime.strptime(due_date, "%Y-%m-%dT%H:%M")
        except ValueError:
            return None, "Invalid due date format. Use YYYY-MM-DDTHH:MM"

        if parsed_due_date <= datetime.utcnow():
            return None, "Due date must be in the future"

        if max_marks is None or float(max_marks) <= 0:
            return None, "Max marks must be greater than 0"

        attachment_data, error = AssignmentService.save_attachment(file)

        if error:
            return None, error

        assignment = Assignment(
            course_batch_id=batch.id,
            created_by=user_id,
            title=title,
            description=description,
            instructions=instructions,
            due_date=parsed_due_date,
            max_marks=int(max_marks),
            status="Draft",
            is_active=True,
            **attachment_data
        )

        db.session.add(assignment)
        db.session.flush()

        AssignmentService.create_audit_log(
            user_id,
            "CREATE_ASSIGNMENT",
            f"Created assignment '{assignment.title}' as Draft"
        )

        db.session.commit()

        return AssignmentService.format_assignment(assignment), None

    @staticmethod
    def update_assignment(assignment_id, user_id, role, form_data, file=None):
        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        access_error = AssignmentService.validate_assignment_access(assignment, user_id, role)

        if access_error:
            return None, access_error

        if role == "Department Staff":
            return None, "Course Coordinator cannot edit assignment content"

        if role == "Lecturer" and assignment.created_by != user_id:
            return None, "Lecturer can edit only their own assignments"

        if assignment.status not in ["Draft"]:
            return None, "Only Draft assignments can be edited"

        title = form_data.get("title", assignment.title).strip()
        description = form_data.get("description", assignment.description or "").strip()
        instructions = form_data.get("instructions", assignment.instructions).strip()
        due_date = form_data.get("due_date")
        max_marks = form_data.get("max_marks", assignment.max_marks)

        if not title:
            return None, "Assignment title is required"

        if not instructions:
            return None, "Assignment instructions are required"

        if due_date:
            try:
                parsed_due_date = datetime.strptime(due_date, "%Y-%m-%dT%H:%M")
            except ValueError:
                return None, "Invalid due date format. Use YYYY-MM-DDTHH:MM"

            if parsed_due_date <= datetime.utcnow():
                return None, "Due date must be in the future"

            assignment.due_date = parsed_due_date

        if float(max_marks) <= 0:
            return None, "Max marks must be greater than 0"

        if file:
            attachment_data, error = AssignmentService.save_attachment(file)

            if error:
                return None, error

            AssignmentService.delete_file_if_exists(assignment.attachment_path)

            assignment.attachment_path = attachment_data["attachment_path"]
            assignment.attachment_name = attachment_data["attachment_name"]
            assignment.attachment_type = attachment_data["attachment_type"]
            assignment.attachment_size = attachment_data["attachment_size"]

        assignment.title = title
        assignment.description = description
        assignment.instructions = instructions
        assignment.max_marks = int(max_marks)

        AssignmentService.create_audit_log(
            user_id,
            "UPDATE_ASSIGNMENT",
            f"Updated assignment '{assignment.title}'"
        )

        db.session.commit()

        return AssignmentService.format_assignment(assignment), None

    @staticmethod
    def submit_for_review(assignment_id, user_id, role):
        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        if role != "Lecturer":
            return None, "Only Lecturer can submit assignment for review"

        if assignment.created_by != user_id:
            return None, "You can submit only your own assignments"

        if assignment.status != "Draft":
            return None, "Only Draft assignments can be submitted for review"

        assignment.status = "Pending Review"

        AssignmentService.create_audit_log(
            user_id,
            "SUBMIT_ASSIGNMENT_REVIEW",
            f"Submitted assignment '{assignment.title}' for review"
        )

        db.session.commit()

        return AssignmentService.format_assignment(assignment), None

    @staticmethod
    def publish_assignment(assignment_id, user_id, role, data):
        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        batch = assignment.course_batch

        if role == "Department Staff" and batch.coordinator_id != user_id:
            return None, "Coordinator can publish only assignments for assigned batches"

        if role not in ["Admin", "Department Staff"]:
            return None, "Only Admin or Course Coordinator can publish assignments"

        if assignment.status not in ["Pending Review", "Draft"]:
            return None, "Only Draft or Pending Review assignments can be published"

        review_note = data.get("review_note", "").strip() if data else ""

        assignment.status = "Published"
        assignment.review_note = review_note
        assignment.published_by = user_id
        assignment.published_at = datetime.utcnow()

        enrollments = BatchEnrollment.query.filter_by(
            batch_id=assignment.course_batch_id,
            enrollment_status="Active"
        ).all()

        for enrollment in enrollments:
            if enrollment.student and enrollment.student.user_id:
                NotificationService.create_notification(
                    user_id=enrollment.student.user_id,
                    title="New Assignment Published",
                    message=f"A new assignment '{assignment.title}' has been published for {batch.batch_code}.",
                    notification_type="Assignment"
                )

        AssignmentService.create_audit_log(
            user_id,
            "PUBLISH_ASSIGNMENT",
            f"Published assignment '{assignment.title}'"
        )

        db.session.commit()

        return AssignmentService.format_assignment(assignment), None

    @staticmethod
    def update_assignment_status(assignment_id, user_id, role, data):
        assignment = Assignment.query.get(assignment_id)

        if not assignment:
            return None, "Assignment not found"

        access_error = AssignmentService.validate_assignment_access(assignment, user_id, role)

        if access_error:
            return None, access_error

        new_status = data.get("status", "").strip()
        review_note = data.get("review_note", "").strip()

        allowed_statuses = ["Closed", "Archived"]

        if new_status not in allowed_statuses:
            return None, "Assignment status can only be changed to Closed or Archived"

        if role == "Lecturer" and assignment.created_by != user_id:
            return None, "Lecturer can update only their own assignments"

        assignment.status = new_status
        assignment.review_note = review_note or assignment.review_note

        AssignmentService.create_audit_log(
            user_id,
            "UPDATE_ASSIGNMENT_STATUS",
            f"Updated assignment '{assignment.title}' status to {new_status}"
        )

        db.session.commit()

        return AssignmentService.format_assignment(assignment), None

    @staticmethod
    def validate_assignment_access(assignment, user_id, role):
        batch = assignment.course_batch

        if role == "Admin":
            return None

        if role == "Lecturer":
            if assignment.created_by != user_id:
                return "Lecturer can access only their own assignments"
            return None

        if role == "Department Staff":
            if batch.coordinator_id != user_id:
                return "Coordinator can access only assigned batch assignments"
            return None

        return "Access denied"

    @staticmethod
    def save_attachment(file):
        empty_data = {
            "attachment_path": None,
            "attachment_name": None,
            "attachment_type": None,
            "attachment_size": None
        }

        if not file or file.filename == "":
            return empty_data, None

        if not AssignmentService.allowed_file(file.filename):
            return None, "Invalid attachment type. Allowed: PDF, DOCX, PPTX, ZIP"

        upload_folder = current_app.config["ASSIGNMENT_ATTACHMENT_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)

        original_filename = secure_filename(file.filename)
        file_type = original_filename.rsplit(".", 1)[1].lower()
        saved_filename = f"assignment_{int(time.time())}_{original_filename}"
        saved_path = os.path.join(upload_folder, saved_filename)

        file.save(saved_path)

        file_size = os.path.getsize(saved_path)

        return {
            "attachment_path": saved_path,
            "attachment_name": original_filename,
            "attachment_type": file_type,
            "attachment_size": file_size
        }, None

    @staticmethod
    def delete_file_if_exists(path):
        if path and os.path.exists(path):
            os.remove(path)

    @staticmethod
    def format_assignment(assignment):
        batch = assignment.course_batch
        course = batch.course if batch else None

        return {
            "id": assignment.id,
            "course_batch_id": assignment.course_batch_id,
            "created_by": assignment.created_by,
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
            "review_note": assignment.review_note,
            "published_by": assignment.published_by,
            "published_at": assignment.published_at.isoformat() if assignment.published_at else None,
            "is_active": assignment.is_active,
            "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
            "updated_at": assignment.updated_at.isoformat() if assignment.updated_at else None,
            "course_batch": {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
                "coordinator_id": batch.coordinator_id,
                "course": {
                    "id": course.id,
                    "course_code": course.course_code,
                    "course_name": course.course_name,
                    "lecturer_id": course.lecturer_id
                } if course else None
            } if batch else None,
            "creator": {
                "id": assignment.creator.id,
                "first_name": assignment.creator.first_name,
                "last_name": assignment.creator.last_name,
                "email": assignment.creator.email
            } if assignment.creator else None,
            "publisher": {
                "id": assignment.publisher.id,
                "first_name": assignment.publisher.first_name,
                "last_name": assignment.publisher.last_name,
                "email": assignment.publisher.email
            } if assignment.publisher else None,
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )
        db.session.add(log)

    @staticmethod
    def get_assignment_batches(user_id, role):
        query = CourseBatch.query.filter(
            CourseBatch.is_active == True,
            CourseBatch.status == "Open"
        )

        if role == "Lecturer":
            query = query.filter(
                CourseBatch.course.has(lecturer_id=user_id)
            )

        elif role == "Department Staff":
            query = query.filter(CourseBatch.coordinator_id == user_id)

        elif role != "Admin":
            return []

        batches = query.order_by(CourseBatch.batch_code.asc()).all()

        return [
            {
                "id": batch.id,
                "batch_code": batch.batch_code,
                "batch_name": batch.batch_name,
                "course": {
                    "id": batch.course.id,
                    "course_code": batch.course.course_code,
                    "course_name": batch.course.course_name,
                    "lecturer_id": batch.course.lecturer_id
                } if batch.course else None
            }
            for batch in batches
        ]