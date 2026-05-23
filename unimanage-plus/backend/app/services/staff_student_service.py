from app.extensions import db
from app.models.user import User
from app.models.student import Student
from app.models.department_staff import DepartmentStaff


class StaffStudentService:

    @staticmethod
    def get_staff_profile(user_id):
        staff = DepartmentStaff.query.filter_by(user_id=user_id).first()

        if not staff:
            return None, "Department staff profile not found"

        return staff, None

    @staticmethod
    def get_students(user_id, search=None, programme=None, year_of_study=None):
        staff, error = StaffStudentService.get_staff_profile(user_id)

        if error:
            return None, error

        query = Student.query.filter(Student.department_id == staff.department_id)

        if search:
            search_value = f"%{search}%"
            query = query.join(User, Student.user_id == User.id).filter(
                db.or_(
                    Student.student_number.ilike(search_value),
                    Student.academic_email.ilike(search_value),
                    Student.programme_name.ilike(search_value),
                    User.first_name.ilike(search_value),
                    User.last_name.ilike(search_value),
                    User.email.ilike(search_value)
                )
            )

        if programme:
            query = query.filter(Student.programme_name == programme)

        if year_of_study:
            query = query.filter(Student.year_of_study == int(year_of_study))

        students = query.order_by(Student.id.desc()).all()

        return [
            StaffStudentService.format_student(student)
            for student in students
        ], None

    @staticmethod
    def get_student_by_id(user_id, student_id):
        staff, error = StaffStudentService.get_staff_profile(user_id)

        if error:
            return None, error

        student = Student.query.filter_by(
            id=student_id,
            department_id=staff.department_id
        ).first()

        if not student:
            return None, "Student not found or not related to your department"

        return StaffStudentService.format_student(student, include_detail=True), None

    @staticmethod
    def get_filter_options(user_id):
        staff, error = StaffStudentService.get_staff_profile(user_id)

        if error:
            return None, error

        programmes = (
            db.session.query(Student.programme_name)
            .filter(
                Student.department_id == staff.department_id,
                Student.programme_name.isnot(None)
            )
            .distinct()
            .order_by(Student.programme_name.asc())
            .all()
        )

        years = (
            db.session.query(Student.year_of_study)
            .filter(
                Student.department_id == staff.department_id,
                Student.year_of_study.isnot(None)
            )
            .distinct()
            .order_by(Student.year_of_study.asc())
            .all()
        )

        return {
            "programmes": [item[0] for item in programmes],
            "years": [item[0] for item in years],
        }, None

    @staticmethod
    def format_student(student, include_detail=False):
        user = student.user
        department = student.department

        result = {
            "id": student.id,
            "user_id": student.user_id,
            "student_number": student.student_number,
            "academic_email": student.academic_email,
            "phone": student.phone,
            "programme_name": student.programme_name,
            "year_of_study": student.year_of_study,
            "enrollment_date": student.enrollment_date.isoformat()
            if student.enrollment_date else None,
            "department": {
                "id": department.id,
                "name": department.name,
                "code": department.code,
            } if department else None,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "is_active": user.is_active,
            } if user else None,
        }

        if include_detail:
            result.update({
                "date_of_birth": student.date_of_birth.isoformat()
                if student.date_of_birth else None,
                "gender": student.gender,
                "address": student.address,
                "profile_image": student.profile_image,
                "created_at": student.created_at.isoformat()
                if student.created_at else None,
                "updated_at": student.updated_at.isoformat()
                if student.updated_at else None,
            })

        return result