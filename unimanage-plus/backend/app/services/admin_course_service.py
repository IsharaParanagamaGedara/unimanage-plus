from app.extensions import db
from app.models.course import Course
from app.models.department import Department
from app.models.user import User
from app.models.role import Role
from app.models.audit_log import AuditLog


class AdminCourseService:

    @staticmethod
    def get_courses(search=None, department_id=None, status=None):
        query = Course.query.join(Department).outerjoin(User)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    Course.course_code.ilike(search_value),
                    Course.course_name.ilike(search_value),
                    Course.description.ilike(search_value),
                    Department.name.ilike(search_value),
                    User.first_name.ilike(search_value),
                    User.last_name.ilike(search_value)
                )
            )

        if department_id:
            query = query.filter(Course.department_id == department_id)

        if status == "active":
            query = query.filter(Course.is_active == True)

        if status == "inactive":
            query = query.filter(Course.is_active == False)

        courses = query.order_by(Course.created_at.desc()).all()

        return [AdminCourseService.format_course(course) for course in courses]

    @staticmethod
    def get_course_by_id(course_id):
        course = Course.query.get(course_id)

        if not course:
            return None, "Course not found"

        return AdminCourseService.format_course(course), None

    @staticmethod
    def create_course(data, created_by_user_id=None):
        department_id = data.get("department_id")
        lecturer_id = data.get("lecturer_id")

        course_code = data.get("course_code", "").strip().upper()
        course_name = data.get("course_name", "").strip()
        description = data.get("description", "").strip()

        credits = data.get("credits")
        capacity = data.get("capacity")

        if not department_id:
            return None, "Department is required"

        department = Department.query.get(department_id)

        if not department:
            return None, "Invalid department selected"

        if not department.is_active:
            return None, "Cannot assign course to an inactive department"

        if not course_code:
            return None, "Course code is required"

        if not course_name:
            return None, "Course name is required"

        if credits is None or int(credits) <= 0:
            return None, "Credits must be greater than 0"

        if capacity is None or int(capacity) <= 0:
            return None, "Capacity must be greater than 0"

        existing_code = Course.query.filter_by(course_code=course_code).first()

        if existing_code:
            return None, "Course code already exists"

        if lecturer_id:
            lecturer_error = AdminCourseService.validate_lecturer(lecturer_id)

            if lecturer_error:
                return None, lecturer_error

        course = Course(
            department_id=department_id,
            lecturer_id=lecturer_id if lecturer_id else None,
            course_code=course_code,
            course_name=course_name,
            description=description,
            credits=int(credits),
            capacity=int(capacity),
            is_active=True
        )

        db.session.add(course)
        db.session.flush()

        AdminCourseService.create_audit_log(
            created_by_user_id,
            "CREATE_COURSE",
            f"Created course: {course.course_code} - {course.course_name}"
        )

        db.session.commit()

        return AdminCourseService.format_course(course), None

    @staticmethod
    def update_course(course_id, data, updated_by_user_id=None):
        course = Course.query.get(course_id)

        if not course:
            return None, "Course not found"

        if not course.is_active:
            return None, "Cannot modify an inactive course"

        department_id = data.get("department_id", course.department_id)
        lecturer_id = data.get("lecturer_id", course.lecturer_id)

        course_code = data.get("course_code", course.course_code).strip().upper()
        course_name = data.get("course_name", course.course_name).strip()
        description = data.get("description", course.description or "").strip()

        credits = data.get("credits", course.credits)
        capacity = data.get("capacity", course.capacity)

        department = Department.query.get(department_id)

        if not department:
            return None, "Invalid department selected"

        if not department.is_active:
            return None, "Cannot assign course to an inactive department"

        if not course_code:
            return None, "Course code is required"

        if not course_name:
            return None, "Course name is required"

        if int(credits) <= 0:
            return None, "Credits must be greater than 0"

        if int(capacity) <= 0:
            return None, "Capacity must be greater than 0"

        existing_code = Course.query.filter(
            Course.course_code == course_code,
            Course.id != course_id
        ).first()

        if existing_code:
            return None, "Course code already exists"

        if lecturer_id:
            lecturer_error = AdminCourseService.validate_lecturer(lecturer_id)

            if lecturer_error:
                return None, lecturer_error

        course.department_id = department_id
        course.lecturer_id = lecturer_id if lecturer_id else None
        course.course_code = course_code
        course.course_name = course_name
        course.description = description
        course.credits = int(credits)
        course.capacity = int(capacity)

        AdminCourseService.create_audit_log(
            updated_by_user_id,
            "UPDATE_COURSE",
            f"Updated course: {course.course_code} - {course.course_name}"
        )

        db.session.commit()

        return AdminCourseService.format_course(course), None

    @staticmethod
    def update_course_status(course_id, is_active, updated_by_user_id=None):
        course = Course.query.get(course_id)

        if not course:
            return None, "Course not found"

        course.is_active = bool(is_active)

        action = "ACTIVATE_COURSE" if course.is_active else "DEACTIVATE_COURSE"

        AdminCourseService.create_audit_log(
            updated_by_user_id,
            action,
            f"{action}: {course.course_code} - {course.course_name}"
        )

        db.session.commit()

        return AdminCourseService.format_course(course), None

    @staticmethod
    def get_active_lecturers():
        lecturers = (
            User.query
            .join(Role)
            .filter(Role.name == "Lecturer", User.is_active == True)
            .order_by(User.first_name.asc())
            .all()
        )

        return [
            {
                "id": lecturer.id,
                "first_name": lecturer.first_name,
                "last_name": lecturer.last_name,
                "email": lecturer.email
            }
            for lecturer in lecturers
        ]

    @staticmethod
    def validate_lecturer(lecturer_id):
        lecturer = User.query.get(lecturer_id)

        if not lecturer:
            return "Invalid lecturer selected"

        if not lecturer.is_active:
            return "Selected lecturer is inactive"

        if lecturer.role.name != "Lecturer":
            return "Selected user is not a lecturer"

        return None

    @staticmethod
    def format_course(course):
        return {
            "id": course.id,
            "department_id": course.department_id,
            "lecturer_id": course.lecturer_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "description": course.description,
            "credits": course.credits,
            "capacity": course.capacity,
            "is_active": course.is_active,
            "department": {
                "id": course.department.id,
                "name": course.department.name,
                "code": course.department.code
            } if course.department else None,
            "lecturer": {
                "id": course.lecturer.id,
                "first_name": course.lecturer.first_name,
                "last_name": course.lecturer.last_name,
                "email": course.lecturer.email
            } if course.lecturer else None,
            "created_at": course.created_at.isoformat() if course.created_at else None,
            "updated_at": course.updated_at.isoformat() if course.updated_at else None
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )

        db.session.add(log)