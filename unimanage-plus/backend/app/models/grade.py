from app.extensions import db
from datetime import datetime

class Grade(db.Model):
    __tablename__ = "grades"

    id = db.Column(db.Integer, primary_key=True)

    submission_id = db.Column(
        db.Integer,
        db.ForeignKey("assignment_submissions.id"),
        unique=True,
        nullable=False
    )

    graded_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    marks = db.Column(db.Float, nullable=False)
    feedback = db.Column(db.Text, nullable=True)

    status = db.Column(db.String(30), default="Draft")
    approval_note = db.Column(db.Text, nullable=True)

    published_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    published_at = db.Column(db.DateTime, nullable=True)

    graded_at = db.Column(db.DateTime, default=datetime.utcnow)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    submission = db.relationship("AssignmentSubmission", backref=db.backref("grade", uselist=False))
    grader = db.relationship("User", foreign_keys=[graded_by], backref="graded_submissions")
    publisher = db.relationship("User", foreign_keys=[published_by], backref="published_grades")