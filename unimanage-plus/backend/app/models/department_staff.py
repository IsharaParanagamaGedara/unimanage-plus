from app.extensions import db
from datetime import datetime

class DepartmentStaff(db.Model):
    __tablename__ = "department_staff"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)

    staff_number = db.Column(db.String(50), unique=True, nullable=False)
    academic_email = db.Column(db.String(150), unique=True, nullable=False)

    phone = db.Column(db.String(30), nullable=True)
    job_title = db.Column(db.String(150), nullable=True)
    office_location = db.Column(db.String(150), nullable=True)
    profile_image = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = db.relationship("User", backref=db.backref("staff_profile", uselist=False))
    department = db.relationship("Department", backref="department_staff")