from app.extensions import db
from datetime import datetime

class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)

    student_number = db.Column(db.String(50), unique=True, nullable=False)
    academic_email = db.Column(db.String(150), unique=True, nullable=False)

    phone = db.Column(db.String(30), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    profile_image = db.Column(db.String(255), nullable=True)

    programme_name = db.Column(db.String(150), nullable=True)
    year_of_study = db.Column(db.Integer, nullable=True)
    enrollment_date = db.Column(db.Date, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = db.relationship("User", backref=db.backref("student_profile", uselist=False))
    department = db.relationship("Department", backref="students")