from app.extensions import db
from datetime import datetime

class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)

    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    course_code = db.Column(db.String(30), unique=True, nullable=False)
    course_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)

    credits = db.Column(db.Integer, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)

    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    department = db.relationship("Department", backref="courses")
    lecturer = db.relationship("User", backref="assigned_courses")