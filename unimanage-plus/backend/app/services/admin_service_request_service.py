from datetime import datetime
from app.extensions import db
from app.models.service_request import ServiceRequest
from app.models.request_status_log import RequestStatusLog
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.role import Role


class AdminServiceRequestService:

    VALID_STATUSES = [
        "Pending",
        "In Progress",
        "Approved",
        "Rejected",
        "Completed",
        "Cancelled"
    ]

    @staticmethod
    def get_requests(search=None, status=None, request_type=None, priority=None):
        query = ServiceRequest.query

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    ServiceRequest.subject.ilike(search_value),
                    ServiceRequest.description.ilike(search_value),
                    ServiceRequest.request_type.ilike(search_value)
                )
            )

        if status:
            query = query.filter(ServiceRequest.status == status)

        if request_type:
            query = query.filter(ServiceRequest.request_type == request_type)

        if priority:
            query = query.filter(ServiceRequest.priority == priority)

        requests = query.order_by(ServiceRequest.submitted_at.desc()).all()

        return [
            AdminServiceRequestService.format_request(service_request)
            for service_request in requests
        ]

    @staticmethod
    def get_request_by_id(request_id):
        service_request = ServiceRequest.query.get(request_id)

        if not service_request:
            return None, "Service request not found"

        return AdminServiceRequestService.format_request(
            service_request,
            include_logs=True
        ), None

    @staticmethod
    def update_status(request_id, data, changed_by_user_id):
        service_request = ServiceRequest.query.get(request_id)

        if not service_request:
            return None, "Service request not found"

        new_status = data.get("status", "").strip()
        note = data.get("note", "").strip()
        assigned_to = data.get("assigned_to")

        if not new_status:
            return None, "Status is required"

        if new_status not in AdminServiceRequestService.VALID_STATUSES:
            return None, "Invalid request status"

        old_status = service_request.status

        if old_status in ["Completed", "Rejected", "Cancelled"]:
            return None, "Finalized requests cannot be updated"

        if new_status == old_status:
            return None, "New status must be different from current status"

        if assigned_to:
            assigned_user = User.query.get(assigned_to)

            if not assigned_user:
                return None, "Assigned user not found"

            if not assigned_user.is_active:
                return None, "Assigned user is inactive"

            if assigned_user.role.name not in ["Admin", "Department Staff"]:
                return None, "Request can only be assigned to Admin or Department Staff"

            service_request.assigned_to = assigned_to

        if new_status in ["Completed", "Approved", "Rejected"]:
            if not note:
                return None, "A note is required when approving, rejecting, or completing a request"

            service_request.resolved_at = datetime.utcnow()
            service_request.resolution_note = note

        service_request.status = new_status

        status_log = RequestStatusLog(
            service_request_id=service_request.id,
            changed_by=changed_by_user_id,
            old_status=old_status,
            new_status=new_status,
            note=note
        )

        db.session.add(status_log)

        AdminServiceRequestService.create_audit_log(
            changed_by_user_id,
            "UPDATE_SERVICE_REQUEST_STATUS",
            f"Updated service request #{service_request.id} from {old_status} to {new_status}"
        )

        db.session.commit()

        return AdminServiceRequestService.format_request(
            service_request,
            include_logs=True
        ), None

    @staticmethod
    def get_assignable_users():
        users = (
            User.query
            .join(Role)
            .filter(
                User.is_active == True,
                Role.name.in_(["Admin", "Department Staff"])
            )
            .order_by(User.first_name.asc())
            .all()
        )

        return [
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role.name
            }
            for user in users
        ]

    @staticmethod
    def format_request(service_request, include_logs=False):
        student = service_request.student
        student_user = student.user if student else None
        assigned_user = service_request.assigned_user

        result = {
            "id": service_request.id,
            "student_id": service_request.student_id,
            "assigned_to": service_request.assigned_to,
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
            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "first_name": student_user.first_name if student_user else None,
                "last_name": student_user.last_name if student_user else None,
                "email": student_user.email if student_user else None,
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