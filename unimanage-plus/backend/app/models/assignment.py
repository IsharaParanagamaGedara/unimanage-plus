from app.extensions import db
from datetime import datetime

class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)

    course_batch_id = db.Column(db.Integer, db.ForeignKey("course_batches.id"), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    instructions = db.Column(db.Text, nullable=False)

    due_date = db.Column(db.DateTime, nullable=False)
    max_marks = db.Column(db.Integer, nullable=False)

    attachment_path = db.Column(db.String(500), nullable=True)
    attachment_name = db.Column(db.String(255), nullable=True)
    attachment_type = db.Column(db.String(50), nullable=True)
    attachment_size = db.Column(db.Integer, nullable=True)

    status = db.Column(db.String(30), default="Draft")
    review_note = db.Column(db.Text, nullable=True)

    published_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    published_at = db.Column(db.DateTime, nullable=True)

    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    course_batch = db.relationship("CourseBatch", backref="assignments")
    creator = db.relationship("User", foreign_keys=[created_by], backref="created_assignments")
    publisher = db.relationship("User", foreign_keys=[published_by], backref="published_assignments")