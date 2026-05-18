from app.extensions import db
from datetime import datetime

class RequestStatusLog(db.Model):
    __tablename__ = "request_status_logs"

    id = db.Column(db.Integer, primary_key=True)

    service_request_id = db.Column(
        db.Integer,
        db.ForeignKey("service_requests.id"),
        nullable=False
    )

    changed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    old_status = db.Column(db.String(30), nullable=True)
    new_status = db.Column(db.String(30), nullable=False)

    note = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    service_request = db.relationship("ServiceRequest", backref="status_logs")
    changed_by_user = db.relationship("User", backref="service_request_status_logs")