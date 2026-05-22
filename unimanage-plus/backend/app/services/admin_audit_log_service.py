from datetime import datetime
from app.extensions import db
from app.models.audit_log import AuditLog
from app.models.user import User


class AdminAuditLogService:

    @staticmethod
    def parse_date(value):
        if not value:
            return None

        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return None

    @staticmethod
    def get_audit_logs(filters=None):
        filters = filters or {}

        query = AuditLog.query.outerjoin(User, AuditLog.user_id == User.id)

        search = filters.get("search")
        action = filters.get("action")
        user_id = filters.get("user_id")
        start_date = AdminAuditLogService.parse_date(filters.get("start_date"))
        end_date = AdminAuditLogService.parse_date(filters.get("end_date"))
        month = filters.get("month")
        year = filters.get("year")

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    AuditLog.action.ilike(search_value),
                    AuditLog.description.ilike(search_value),
                    User.first_name.ilike(search_value),
                    User.last_name.ilike(search_value),
                    User.email.ilike(search_value)
                )
            )

        if action:
            query = query.filter(AuditLog.action == action)

        if user_id:
            query = query.filter(AuditLog.user_id == int(user_id))

        if start_date:
            query = query.filter(db.func.date(AuditLog.created_at) >= start_date)

        if end_date:
            query = query.filter(db.func.date(AuditLog.created_at) <= end_date)

        if month and year:
            query = query.filter(db.extract("month", AuditLog.created_at) == int(month))
            query = query.filter(db.extract("year", AuditLog.created_at) == int(year))
        elif year:
            query = query.filter(db.extract("year", AuditLog.created_at) == int(year))

        logs = query.order_by(AuditLog.created_at.desc()).all()

        return [AdminAuditLogService.format_log(log) for log in logs]

    @staticmethod
    def get_audit_log_by_id(log_id):
        log = AuditLog.query.get(log_id)

        if not log:
            return None, "Audit log not found"

        return AdminAuditLogService.format_log(log), None

    @staticmethod
    def get_actions():
        actions = (
            db.session.query(AuditLog.action)
            .filter(AuditLog.action.isnot(None))
            .distinct()
            .order_by(AuditLog.action.asc())
            .all()
        )

        return [action[0] for action in actions]

    @staticmethod
    def format_log(log):
        user = User.query.get(log.user_id) if log.user_id else None

        return {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "description": log.description,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role.name if user.role else None,
            } if user else None,
        }