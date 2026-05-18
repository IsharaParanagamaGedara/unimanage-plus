from app.extensions import db
from app.models.student import Student
from app.models.service_request import ServiceRequest
from app.models.request_status_log import RequestStatusLog
from app.models.audit_log import AuditLog


class StudentServiceRequestService:

    REQUEST_TYPES = [
        "Transcript Request",
        "Academic Letter Request",
        "Course Change Request",
        "Exam Issue Request",
        "Technical Support Request",
        "Other"
    ]

    PRIORITIES = ["Low", "Normal", "High", "Urgent"]

    @staticmethod
    def get_student_profile(user_id):
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return None, "Student profile not found"

        return student, None

    @staticmethod
    def create_request(user_id, data):
        student, error = StudentServiceRequestService.get_student_profile(user_id)

        if error:
            return None, error

        request_type = data.get("request_type", "").strip()
        subject = data.get("subject", "").strip()
        description = data.get("description", "").strip()
        priority = data.get("priority", "Normal").strip()

        if not request_type:
            return None, "Request type is required"

        if request_type not in StudentServiceRequestService.REQUEST_TYPES:
            return None, "Invalid request type"

        if not subject:
            return None, "Subject is required"

        if len(subject) < 5:
            return None, "Subject must be at least 5 characters"

        if not description:
            return None, "Description is required"

        if len(description) < 10:
            return None, "Description must be at least 10 characters"

        if priority not in StudentServiceRequestService.PRIORITIES:
            return None, "Invalid priority"

        service_request = ServiceRequest(
            student_id=student.id,
            request_type=request_type,
            subject=subject,
            description=description,
            priority=priority,
            status="Pending"
        )

        db.session.add(service_request)
        db.session.flush()

        status_log = RequestStatusLog(
            service_request_id=service_request.id,
            changed_by=user_id,
            old_status=None,
            new_status="Pending",
            note="Service request submitted by student"
        )
        db.session.add(status_log)

        StudentServiceRequestService.create_audit_log(
            user_id,
            "CREATE_SERVICE_REQUEST",
            f"Student submitted service request: {subject}"
        )

        db.session.commit()

        return StudentServiceRequestService.format_request(
            service_request,
            include_logs=True
        ), None

    @staticmethod
    def get_my_requests(user_id, status=None, request_type=None):
        student, error = StudentServiceRequestService.get_student_profile(user_id)

        if error:
            return None, error

        query = ServiceRequest.query.filter_by(student_id=student.id)

        if status:
            query = query.filter(ServiceRequest.status == status)

        if request_type:
            query = query.filter(ServiceRequest.request_type == request_type)

        requests = query.order_by(ServiceRequest.submitted_at.desc()).all()

        return [
            StudentServiceRequestService.format_request(service_request)
            for service_request in requests
        ], None

    @staticmethod
    def get_request_by_id(user_id, request_id):
        student, error = StudentServiceRequestService.get_student_profile(user_id)

        if error:
            return None, error

        service_request = ServiceRequest.query.filter_by(
            id=request_id,
            student_id=student.id
        ).first()

        if not service_request:
            return None, "Service request not found"

        return StudentServiceRequestService.format_request(
            service_request,
            include_logs=True
        ), None

    @staticmethod
    def format_request(service_request, include_logs=False):
        student = service_request.student
        user = student.user if student else None
        assigned_user = service_request.assigned_user

        result = {
            "id": service_request.id,
            "student_id": service_request.student_id,
            "request_type": service_request.request_type,
            "subject": service_request.subject,
            "description": service_request.description,
            "status": service_request.status,
            "priority": service_request.priority,
            "resolution_note": service_request.resolution_note,
            "submitted_at": service_request.submitted_at.isoformat()
            if service_request.submitted_at else None,
            "resolved_at": service_request.resolved_at.isoformat()
            if service_request.resolved_at else None,
            "created_at": service_request.created_at.isoformat()
            if service_request.created_at else None,
            "updated_at": service_request.updated_at.isoformat()
            if service_request.updated_at else None,
            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
                "programme_name": student.programme_name,
                "year_of_study": student.year_of_study,
            } if student else None,
            "assigned_user": {
                "id": assigned_user.id,
                "first_name": assigned_user.first_name,
                "last_name": assigned_user.last_name,
                "email": assigned_user.email,
                "role": assigned_user.role.name if assigned_user.role else None,
            } if assigned_user else None,
        }

        if include_logs:
            result["status_logs"] = [
                {
                    "id": log.id,
                    "old_status": log.old_status,
                    "new_status": log.new_status,
                    "note": log.note,
                    "created_at": log.created_at.isoformat()
                    if log.created_at else None,
                    "changed_by": {
                        "id": log.changed_by_user.id,
                        "first_name": log.changed_by_user.first_name,
                        "last_name": log.changed_by_user.last_name,
                        "email": log.changed_by_user.email,
                    } if log.changed_by_user else None,
                }
                for log in sorted(
                    service_request.status_logs,
                    key=lambda item: item.created_at,
                    reverse=True
                )
            ]

        return result

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )
        db.session.add(log)