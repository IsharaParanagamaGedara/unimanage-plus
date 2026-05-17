from app.extensions import db
from datetime import datetime

class CourseBatch(db.Model):
    __tablename__ = "course_batches"

    id = db.Column(db.Integer, primary_key=True)

    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    coordinator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    batch_code = db.Column(db.String(50), unique=True, nullable=False)
    batch_name = db.Column(db.String(150), nullable=False)

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    application_deadline = db.Column(db.Date, nullable=False)

    capacity = db.Column(db.Integer, nullable=False)

    status = db.Column(db.String(30), default="Open")
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    course = db.relationship("Course", backref="batches")
    coordinator = db.relationship("User", backref="coordinated_batches")