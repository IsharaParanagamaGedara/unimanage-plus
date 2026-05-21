import os
import time
from werkzeug.utils import secure_filename
from flask import current_app
from app.extensions import db
from app.models.course import Course
from app.models.course_batch import CourseBatch
from app.models.course_material import CourseMaterial
from app.models.batch_enrollment import BatchEnrollment
from app.models.student import Student
from app.models.audit_log import AuditLog

ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "zip"}


class CourseMaterialService:

    @staticmethod
    def allowed_file(filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def validate_course_access(course, user_id, role, manage=False):
        if not course:
            return "Course not found"

        if not course.is_active:
            return "Materials cannot be accessed for inactive courses"

        if role == "Admin":
            return None

        if role == "Lecturer":
            if course.lecturer_id != user_id:
                return "Lecturer can access materials only for assigned courses"
            return None

        if role == "Department Staff":
            coordinator_batch = CourseBatch.query.filter_by(
                course_id=course.id,
                coordinator_id=user_id
            ).first()

            if not coordinator_batch:
                return "Course Coordinator can access materials only for coordinated courses"

            if manage:
                return "Course Coordinator cannot manage course materials"

            return None

        if role == "Student":
            if manage:
                return "Student cannot manage course materials"

            student = Student.query.filter_by(user_id=user_id).first()

            if not student:
                return "Student profile not found"

            enrolled = (
                BatchEnrollment.query
                .join(CourseBatch, BatchEnrollment.batch_id == CourseBatch.id)
                .filter(
                    BatchEnrollment.student_id == student.id,
                    BatchEnrollment.enrollment_status == "Active",
                    CourseBatch.course_id == course.id
                )
                .first()
            )

            if not enrolled:
                return "Student can access materials only for enrolled courses"

            return None

        return "Access denied"

    @staticmethod
    def get_materials_by_course(course_id, user_id, role):
        course = Course.query.get(course_id)

        access_error = CourseMaterialService.validate_course_access(
            course=course,
            user_id=user_id,
            role=role,
            manage=False
        )

        if access_error:
            return None, access_error

        query = CourseMaterial.query.filter_by(course_id=course_id)

        if role in ["Student", "Department Staff"]:
            query = query.filter_by(is_active=True)

        materials = query.order_by(CourseMaterial.created_at.desc()).all()

        return [CourseMaterialService.format_material(material) for material in materials], None

    @staticmethod
    def upload_material(course_id, form_data, file, uploaded_by_user_id, role):
        course = Course.query.get(course_id)

        access_error = CourseMaterialService.validate_course_access(
            course=course,
            user_id=uploaded_by_user_id,
            role=role,
            manage=True
        )

        if access_error:
            return None, access_error

        if role not in ["Admin", "Lecturer"]:
            return None, "Only Admin or Lecturer can upload course materials"

        title = form_data.get("title", "").strip()
        description = form_data.get("description", "").strip()

        if not title:
            return None, "Material title is required"

        if not file:
            return None, "Material file is required"

        if file.filename == "":
            return None, "No selected file"

        if not CourseMaterialService.allowed_file(file.filename):
            return None, "Invalid file type. Allowed types: PDF, DOCX, PPTX, ZIP"

        upload_folder = current_app.config["COURSE_MATERIAL_FOLDER"]
        os.makedirs(upload_folder, exist_ok=True)

        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit(".", 1)[1].lower()

        saved_filename = f"course_{course_id}_{int(time.time())}_{original_filename}"
        saved_path = os.path.join(upload_folder, saved_filename)

        file.save(saved_path)

        file_size = os.path.getsize(saved_path)

        material = CourseMaterial(
            course_id=course_id,
            uploaded_by=uploaded_by_user_id,
            title=title,
            description=description,
            file_name=original_filename,
            file_path=saved_path,
            file_type=file_extension,
            file_size=file_size,
            is_active=True
        )

        db.session.add(material)
        db.session.flush()

        CourseMaterialService.create_audit_log(
            uploaded_by_user_id,
            "UPLOAD_COURSE_MATERIAL",
            f"Uploaded material '{title}' for course {course.course_code}"
        )

        db.session.commit()

        return CourseMaterialService.format_material(material), None

    @staticmethod
    def update_material(material_id, data, updated_by_user_id, role):
        material = CourseMaterial.query.get(material_id)

        if not material:
            return None, "Course material not found"

        access_error = CourseMaterialService.validate_course_access(
            course=material.course,
            user_id=updated_by_user_id,
            role=role,
            manage=True
        )

        if access_error:
            return None, access_error

        if role not in ["Admin", "Lecturer"]:
            return None, "Only Admin or Lecturer can update course materials"

        title = data.get("title", material.title).strip()
        description = data.get("description", material.description or "").strip()

        if not title:
            return None, "Material title is required"

        material.title = title
        material.description = description

        CourseMaterialService.create_audit_log(
            updated_by_user_id,
            "UPDATE_COURSE_MATERIAL",
            f"Updated material '{material.title}'"
        )

        db.session.commit()

        return CourseMaterialService.format_material(material), None

    @staticmethod
    def update_material_status(material_id, is_active, updated_by_user_id, role):
        material = CourseMaterial.query.get(material_id)

        if not material:
            return None, "Course material not found"

        access_error = CourseMaterialService.validate_course_access(
            course=material.course,
            user_id=updated_by_user_id,
            role=role,
            manage=True
        )

        if access_error:
            return None, access_error

        if role not in ["Admin", "Lecturer"]:
            return None, "Only Admin or Lecturer can activate/deactivate course materials"

        material.is_active = bool(is_active)

        action = "ACTIVATE_COURSE_MATERIAL" if material.is_active else "DEACTIVATE_COURSE_MATERIAL"

        CourseMaterialService.create_audit_log(
            updated_by_user_id,
            action,
            f"{action}: {material.title}"
        )

        db.session.commit()

        return CourseMaterialService.format_material(material), None

    @staticmethod
    def get_material_for_download(material_id, user_id, role):
        material = CourseMaterial.query.get(material_id)

        if not material:
            return None, "Course material not found"

        access_error = CourseMaterialService.validate_course_access(
            course=material.course,
            user_id=user_id,
            role=role,
            manage=False
        )

        if access_error:
            return None, access_error

        if role in ["Student", "Department Staff"] and not material.is_active:
            return None, "This material is not available"

        if not os.path.exists(material.file_path):
            return None, "File not found on server"

        return material, None

    @staticmethod
    def format_material(material):
        return {
            "id": material.id,
            "course_id": material.course_id,
            "uploaded_by": material.uploaded_by,
            "title": material.title,
            "description": material.description,
            "file_name": material.file_name,
            "file_type": material.file_type,
            "file_size": material.file_size,
            "file_size_mb": round(material.file_size / (1024 * 1024), 2),
            "is_active": material.is_active,
            "course": {
                "id": material.course.id,
                "course_code": material.course.course_code,
                "course_name": material.course.course_name
            } if material.course else None,
            "uploader": {
                "id": material.uploader.id,
                "first_name": material.uploader.first_name,
                "last_name": material.uploader.last_name,
                "email": material.uploader.email
            } if material.uploader else None,
            "created_at": material.created_at.isoformat() if material.created_at else None,
            "updated_at": material.updated_at.isoformat() if material.updated_at else None
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )

        db.session.add(log)