from app.extensions import db
from datetime import datetime

class AssignmentSubmission(db.Model):
    __tablename__ = "assignment_submissions"

    id = db.Column(db.Integer, primary_key=True)

    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)

    submission_text = db.Column(db.Text, nullable=True)

    file_path = db.Column(db.String(500), nullable=True)
    file_name = db.Column(db.String(255), nullable=True)
    file_type = db.Column(db.String(50), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)

    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(30), default="Submitted")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    assignment = db.relationship("Assignment", backref="submissions")
    student = db.relationship("Student", backref="assignment_submissions")