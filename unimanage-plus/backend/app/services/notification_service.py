from app.extensions import db
from app.models.notification import Notification


class NotificationService:

    @staticmethod
    def create_notification(user_id, title, message, notification_type="General"):
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )

        db.session.add(notification)
        return notification

    @staticmethod
    def get_my_notifications(user_id, unread_only=False):
        query = Notification.query.filter_by(user_id=user_id)

        if unread_only:
            query = query.filter(Notification.is_read == False)

        notifications = query.order_by(Notification.created_at.desc()).all()

        return [
            NotificationService.format_notification(notification)
            for notification in notifications
        ]

    @staticmethod
    def get_unread_count(user_id):
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()

    @staticmethod
    def mark_as_read(user_id, notification_id):
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()

        if not notification:
            return None, "Notification not found"

        notification.is_read = True
        db.session.commit()

        return NotificationService.format_notification(notification), None

    @staticmethod
    def mark_all_as_read(user_id):
        Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({"is_read": True})

        db.session.commit()

        return True

    @staticmethod
    def format_notification(notification):
        return {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat()
            if notification.created_at else None,
        }