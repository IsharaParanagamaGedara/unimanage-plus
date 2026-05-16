from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.department import Department
from app.models.student import Student
from app.models.lecturer import Lecturer
from app.models.department_staff import DepartmentStaff
from app.models.audit_log import AuditLog
from app.utils.account_utils import (
    generate_temp_password,
    generate_academic_email,
    generate_student_number,
    generate_staff_number
)


class AdminUserService:

    @staticmethod
    def get_roles():
        roles = Role.query.all()

        return [
            {
                "id": role.id,
                "name": role.name
            }
            for role in roles
        ]

    @staticmethod
    def get_departments():
        departments = Department.query.filter_by(is_active=True).all()

        return [
            {
                "id": department.id,
                "name": department.name,
                "code": department.code
            }
            for department in departments
        ]

    @staticmethod
    def get_all_users(search=None, role_id=None, status=None):
        query = User.query.join(Role)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_value),
                    User.last_name.ilike(search_value),
                    User.email.ilike(search_value),
                    Role.name.ilike(search_value)
                )
            )

        if role_id:
            query = query.filter(User.role_id == role_id)

        if status == "active":
            query = query.filter(User.is_active == True)

        if status == "inactive":
            query = query.filter(User.is_active == False)

        users = query.order_by(User.created_at.desc()).all()

        return [AdminUserService.format_user(user) for user in users]

    @staticmethod
    def get_user_by_id(user_id):
        user = User.query.get(user_id)

        if not user:
            return None, "User not found"

        return AdminUserService.format_user(user, include_profile=True), None

    @staticmethod
    def create_user(data, created_by_user_id=None):
        required_fields = ["first_name", "last_name", "role_id"]

        for field in required_fields:
            if not data.get(field):
                return None, f"{field} is required"

        role = Role.query.get(data.get("role_id"))

        if not role:
            return None, "Invalid role selected"

        first_name = data.get("first_name").strip()
        last_name = data.get("last_name").strip()

        academic_email = generate_academic_email(first_name, last_name, role.name)

        existing_email = User.query.filter_by(email=academic_email).first()

        if existing_email:
            return None, "Generated academic email already exists. Please use a different name."

        temp_password = generate_temp_password(
            prefix=role.name.split()[0][:3]
        )

        user = User(
            first_name=first_name,
            last_name=last_name,
            email=academic_email,
            role_id=role.id,
            is_active=True,
            must_change_password=True
        )

        user.set_password(temp_password)

        db.session.add(user)
        db.session.flush()

        AdminUserService.create_role_profile(user, role.name, data)

        AdminUserService.create_audit_log(
            created_by_user_id,
            "CREATE_USER",
            f"Created user account for {academic_email}"
        )

        db.session.commit()

        return {
            "user": AdminUserService.format_user(user, include_profile=True),
            "credentials": {
                "academic_email": academic_email,
                "temporary_password": temp_password
            }
        }, None

    @staticmethod
    def update_user(user_id, data, updated_by_user_id=None):
        user = User.query.get(user_id)

        if not user:
            return None, "User not found"

        if data.get("first_name"):
            user.first_name = data.get("first_name").strip()

        if data.get("last_name"):
            user.last_name = data.get("last_name").strip()

        department_id = data.get("department_id")

        if user.role.name == "Student" and user.student_profile:
            profile = user.student_profile
            profile.phone = data.get("phone", profile.phone)
            profile.gender = data.get("gender", profile.gender)
            profile.address = data.get("address", profile.address)
            profile.programme_name = data.get("programme_name", profile.programme_name)
            profile.year_of_study = data.get("year_of_study", profile.year_of_study)
            profile.department_id = department_id or profile.department_id

        elif user.role.name == "Lecturer" and user.lecturer_profile:
            profile = user.lecturer_profile
            profile.phone = data.get("phone", profile.phone)
            profile.qualification = data.get("qualification", profile.qualification)
            profile.specialization = data.get("specialization", profile.specialization)
            profile.office_location = data.get("office_location", profile.office_location)
            profile.department_id = department_id or profile.department_id

        elif user.role.name == "Department Staff" and user.staff_profile:
            profile = user.staff_profile
            profile.phone = data.get("phone", profile.phone)
            profile.job_title = data.get("job_title", profile.job_title)
            profile.office_location = data.get("office_location", profile.office_location)
            profile.department_id = department_id or profile.department_id

        AdminUserService.create_audit_log(
            updated_by_user_id,
            "UPDATE_USER",
            f"Updated user account: {user.email}"
        )

        db.session.commit()

        return AdminUserService.format_user(user, include_profile=True), None

    @staticmethod
    def update_user_status(user_id, is_active, updated_by_user_id=None):
        user = User.query.get(user_id)

        if not user:
            return None, "User not found"

        user.is_active = bool(is_active)

        action = "ACTIVATE_USER" if user.is_active else "DEACTIVATE_USER"

        AdminUserService.create_audit_log(
            updated_by_user_id,
            action,
            f"{action} for {user.email}"
        )

        db.session.commit()

        return AdminUserService.format_user(user), None

    @staticmethod
    def create_role_profile(user, role_name, data):
        department_id = data.get("department_id")

        if role_name == "Student":
            profile = Student(
                user_id=user.id,
                department_id=department_id,
                student_number=generate_student_number(user.id),
                academic_email=user.email,
                phone=data.get("phone"),
                gender=data.get("gender"),
                address=data.get("address"),
                programme_name=data.get("programme_name"),
                year_of_study=data.get("year_of_study")
            )
            db.session.add(profile)

        elif role_name == "Lecturer":
            profile = Lecturer(
                user_id=user.id,
                department_id=department_id,
                staff_number=generate_staff_number(user.id, "LEC"),
                academic_email=user.email,
                phone=data.get("phone"),
                qualification=data.get("qualification"),
                specialization=data.get("specialization"),
                office_location=data.get("office_location")
            )
            db.session.add(profile)

        elif role_name == "Department Staff":
            profile = DepartmentStaff(
                user_id=user.id,
                department_id=department_id,
                staff_number=generate_staff_number(user.id, "STF"),
                academic_email=user.email,
                phone=data.get("phone"),
                job_title=data.get("job_title"),
                office_location=data.get("office_location")
            )
            db.session.add(profile)

    @staticmethod
    def format_user(user, include_profile=False):
        result = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": {
                "id": user.role.id,
                "name": user.role.name
            },
            "is_active": user.is_active,
            "must_change_password": user.must_change_password,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }

        if include_profile:
            result["profile"] = AdminUserService.get_profile_data(user)

        return result

    @staticmethod
    def get_profile_data(user):
        if user.role.name == "Student" and user.student_profile:
            profile = user.student_profile
            return {
                "type": "Student",
                "student_number": profile.student_number,
                "academic_email": profile.academic_email,
                "phone": profile.phone,
                "gender": profile.gender,
                "address": profile.address,
                "programme_name": profile.programme_name,
                "year_of_study": profile.year_of_study,
                "department_id": profile.department_id,
                "profile_image": profile.profile_image
            }

        if user.role.name == "Lecturer" and user.lecturer_profile:
            profile = user.lecturer_profile
            return {
                "type": "Lecturer",
                "staff_number": profile.staff_number,
                "academic_email": profile.academic_email,
                "phone": profile.phone,
                "qualification": profile.qualification,
                "specialization": profile.specialization,
                "office_location": profile.office_location,
                "department_id": profile.department_id,
                "profile_image": profile.profile_image
            }

        if user.role.name == "Department Staff" and user.staff_profile:
            profile = user.staff_profile
            return {
                "type": "Department Staff",
                "staff_number": profile.staff_number,
                "academic_email": profile.academic_email,
                "phone": profile.phone,
                "job_title": profile.job_title,
                "office_location": profile.office_location,
                "department_id": profile.department_id,
                "profile_image": profile.profile_image
            }

        return None

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )

        db.session.add(log)