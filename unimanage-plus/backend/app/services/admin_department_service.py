from app.extensions import db
from app.models.department import Department
from app.models.audit_log import AuditLog


class AdminDepartmentService:

    @staticmethod
    def get_departments(search=None, status=None):
        query = Department.query

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    Department.name.ilike(search_value),
                    Department.code.ilike(search_value),
                    Department.description.ilike(search_value)
                )
            )

        if status == "active":
            query = query.filter(Department.is_active == True)

        if status == "inactive":
            query = query.filter(Department.is_active == False)

        departments = query.order_by(Department.created_at.desc()).all()

        return [AdminDepartmentService.format_department(d) for d in departments]

    @staticmethod
    def get_department_by_id(department_id):
        department = Department.query.get(department_id)

        if not department:
            return None, "Department not found"

        return AdminDepartmentService.format_department(department), None

    @staticmethod
    def create_department(data, created_by_user_id=None):
        name = data.get("name", "").strip()
        code = data.get("code", "").strip().upper()
        description = data.get("description", "").strip()

        if not name:
            return None, "Department name is required"

        if not code:
            return None, "Department code is required"

        existing_name = Department.query.filter_by(name=name).first()
        if existing_name:
            return None, "Department name already exists"

        existing_code = Department.query.filter_by(code=code).first()
        if existing_code:
            return None, "Department code already exists"

        department = Department(
            name=name,
            code=code,
            description=description,
            is_active=True
        )

        db.session.add(department)
        db.session.flush()

        AdminDepartmentService.create_audit_log(
            created_by_user_id,
            "CREATE_DEPARTMENT",
            f"Created department: {department.name}"
        )

        db.session.commit()

        return AdminDepartmentService.format_department(department), None

    @staticmethod
    def update_department(department_id, data, updated_by_user_id=None):
        department = Department.query.get(department_id)

        if not department:
            return None, "Department not found"

        if not department.is_active:
            return None, "Inactive departments cannot be modified"

        name = data.get("name", department.name).strip()
        code = data.get("code", department.code).strip().upper()
        description = data.get("description", department.description or "").strip()

        existing_name = Department.query.filter(
            Department.name == name,
            Department.id != department_id
        ).first()

        if existing_name:
            return None, "Department name already exists"

        existing_code = Department.query.filter(
            Department.code == code,
            Department.id != department_id
        ).first()

        if existing_code:
            return None, "Department code already exists"

        department.name = name
        department.code = code
        department.description = description

        AdminDepartmentService.create_audit_log(
            updated_by_user_id,
            "UPDATE_DEPARTMENT",
            f"Updated department: {department.name}"
        )

        db.session.commit()

        return AdminDepartmentService.format_department(department), None

    @staticmethod
    def update_department_status(department_id, is_active, updated_by_user_id=None):
        department = Department.query.get(department_id)

        if not department:
            return None, "Department not found"

        department.is_active = bool(is_active)

        action = "ACTIVATE_DEPARTMENT" if department.is_active else "DEACTIVATE_DEPARTMENT"

        AdminDepartmentService.create_audit_log(
            updated_by_user_id,
            action,
            f"{action}: {department.name}"
        )

        db.session.commit()

        return AdminDepartmentService.format_department(department), None

    @staticmethod
    def format_department(department):
        return {
            "id": department.id,
            "name": department.name,
            "code": department.code,
            "description": department.description,
            "is_active": department.is_active,
            "created_at": department.created_at.isoformat() if department.created_at else None,
            "updated_at": department.updated_at.isoformat() if department.updated_at else None
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )

        db.session.add(log)