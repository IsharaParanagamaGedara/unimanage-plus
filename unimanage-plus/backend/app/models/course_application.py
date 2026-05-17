from app.extensions import db
from datetime import datetime

class CourseApplication(db.Model):
    __tablename__ = "course_applications"

    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "batch_id",
            name="uq_student_batch_application"
        ),
    )

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    batch_id = db.Column(
        db.Integer,
        db.ForeignKey("course_batches.id"),
        nullable=False
    )

    status = db.Column(db.String(30), default="Pending")
    application_note = db.Column(db.Text, nullable=True)

    reviewed_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    review_note = db.Column(db.Text, nullable=True)

    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    student = db.relationship(
        "Student",
        backref="course_applications"
    )

    batch = db.relationship(
        "CourseBatch",
        backref="applications"
    )

    reviewer = db.relationship(
        "User",
        backref="reviewed_course_applications"
    )