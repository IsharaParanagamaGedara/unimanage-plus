import os
from werkzeug.utils import secure_filename
from flask import current_app
from app.extensions import db
from app.models.course import Course
from app.models.course_material import CourseMaterial
from app.models.audit_log import AuditLog

ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "zip"}


class CourseMaterialService:

    @staticmethod
    def allowed_file(filename):
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def get_materials_by_course(course_id):
        course = Course.query.get(course_id)

        if not course:
            return None, "Course not found"

        materials = (
            CourseMaterial.query
            .filter_by(course_id=course_id)
            .order_by(CourseMaterial.created_at.desc())
            .all()
        )

        return [CourseMaterialService.format_material(material) for material in materials], None

    @staticmethod
    def upload_material(course_id, form_data, file, uploaded_by_user_id):
        course = Course.query.get(course_id)

        if not course:
            return None, "Course not found"

        if not course.is_active:
            return None, "Cannot upload materials to an inactive course"

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

        saved_filename = f"course_{course_id}_{int(__import__('time').time())}_{original_filename}"
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
    def update_material(material_id, data, updated_by_user_id):
        material = CourseMaterial.query.get(material_id)

        if not material:
            return None, "Course material not found"

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
    def update_material_status(material_id, is_active, updated_by_user_id):
        material = CourseMaterial.query.get(material_id)

        if not material:
            return None, "Course material not found"

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
    def get_material_for_download(material_id):
        material = CourseMaterial.query.get(material_id)

        if not material:
            return None, "Course material not found"

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