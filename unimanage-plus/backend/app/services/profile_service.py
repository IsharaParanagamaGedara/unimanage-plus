import os
import time
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from flask import current_app
from app.extensions import db
from app.models.user import User

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB


class ProfileService:

    @staticmethod
    def allowed_image(filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

    @staticmethod
    def get_my_profile(user_id):
        user = User.query.get(user_id)

        if not user:
            return None, "User not found"

        return ProfileService.format_user_profile(user), None

    @staticmethod
    def update_my_profile(user_id, data, file=None):
        user = User.query.get(user_id)

        if not user:
            return None, "User not found"

        user.first_name = data.get("first_name", user.first_name).strip()
        user.last_name = data.get("last_name", user.last_name).strip()

        role_name = user.role.name if user.role else None
        profile = ProfileService.get_role_profile(user, role_name)

        if profile:
            if "phone" in data:
                profile.phone = data.get("phone", profile.phone)

            if role_name == "Student" and "address" in data:
                profile.address = data.get("address", profile.address)

            if role_name in ["Lecturer", "Department Staff"] and "office_location" in data:
                profile.office_location = data.get("office_location", profile.office_location)

            if file:
                image_path, error = ProfileService.save_profile_image(file)

                if error:
                    return None, error

                profile.profile_image = image_path

        db.session.commit()

        return ProfileService.format_user_profile(user), None

    @staticmethod
    def change_password(user_id, data):
        user = User.query.get(user_id)

        if not user:
            return None, "User not found"

        current_password = data.get("current_password", "")
        new_password = data.get("new_password", "")
        confirm_password = data.get("confirm_password", "")

        if not current_password:
            return None, "Current password is required"

        if not new_password:
            return None, "New password is required"

        if len(new_password) < 8:
            return None, "New password must be at least 8 characters"

        if new_password != confirm_password:
            return None, "New password and confirm password do not match"

        if not check_password_hash(user.password_hash, current_password):
            return None, "Current password is incorrect"

        user.password_hash = generate_password_hash(new_password)
        user.must_change_password = False

        db.session.commit()

        return {
            "message": "Password changed successfully",
            "must_change_password": user.must_change_password
        }, None

    @staticmethod
    def get_role_profile(user, role_name):
        if role_name == "Student":
            return user.student_profile

        if role_name == "Lecturer":
            return user.lecturer_profile

        if role_name == "Department Staff":
            return user.staff_profile

        return None

    @staticmethod
    def save_profile_image(file):
        if not file or file.filename == "":
            return None, None

        if not ProfileService.allowed_image(file.filename):
            return None, "Invalid image type. Allowed: JPG, JPEG, PNG"

        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > MAX_PROFILE_IMAGE_SIZE:
            return None, "Profile image must be smaller than 2MB"

        upload_folder = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            "profile_images"
        )

        os.makedirs(upload_folder, exist_ok=True)

        original_filename = secure_filename(file.filename)
        saved_filename = f"profile_{int(time.time())}_{original_filename}"
        saved_path = os.path.join(upload_folder, saved_filename)

        file.save(saved_path)

        return f"uploads/profile_images/{saved_filename}", None

    @staticmethod
    def format_user_profile(user):
        role_name = user.role.name if user.role else None
        profile = ProfileService.get_role_profile(user, role_name)

        profile_data = None

        if role_name == "Student" and profile:
            profile_data = {
                "student_number": profile.student_number,
                "academic_email": profile.academic_email,
                "phone": profile.phone,
                "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                "gender": profile.gender,
                "address": profile.address,
                "programme_name": profile.programme_name,
                "year_of_study": profile.year_of_study,
                "enrollment_date": profile.enrollment_date.isoformat() if profile.enrollment_date else None,
                "department": profile.department.name if profile.department else None,
                "profile_image": profile.profile_image,
            }

        elif role_name == "Lecturer" and profile:
            profile_data = {
                "staff_number": profile.staff_number,
                "academic_email": profile.academic_email,
                "phone": profile.phone,
                "qualification": profile.qualification,
                "specialization": profile.specialization,
                "office_location": profile.office_location,
                "hire_date": profile.hire_date.isoformat() if profile.hire_date else None,
                "department": profile.department.name if profile.department else None,
                "profile_image": profile.profile_image,
            }

        elif role_name == "Department Staff" and profile:
            profile_data = {
                "staff_number": profile.staff_number,
                "academic_email": profile.academic_email,
                "phone": profile.phone,
                "job_title": profile.job_title,
                "office_location": profile.office_location,
                "department": profile.department.name if profile.department else None,
                "profile_image": profile.profile_image,
            }

        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": role_name,
            "is_active": user.is_active,
            "must_change_password": user.must_change_password,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "profile": profile_data,
        }