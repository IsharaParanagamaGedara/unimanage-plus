from app.extensions import db
from datetime import datetime

class BatchEnrollment(db.Model):
    __tablename__ = "batch_enrollments"

    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "batch_id",
            name="uq_student_batch_enrollment"
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

    application_id = db.Column(
        db.Integer,
        db.ForeignKey("course_applications.id"),
        unique=True,
        nullable=False
    )

    enrollment_status = db.Column(
        db.String(30),
        default="Active"
    )

    enrolled_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    student = db.relationship(
        "Student",
        backref="batch_enrollments"
    )

    batch = db.relationship(
        "CourseBatch",
        backref="enrollments"
    )

    application = db.relationship(
        "CourseApplication",
        backref="batch_enrollment"
    )