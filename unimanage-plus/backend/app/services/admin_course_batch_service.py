from datetime import datetime
from app.extensions import db
from app.models.course_batch import CourseBatch
from app.models.course import Course
from app.models.user import User
from app.models.role import Role
from app.models.audit_log import AuditLog


class AdminCourseBatchService:

    @staticmethod
    def get_batches(search=None, course_id=None, status=None):
        query = CourseBatch.query.join(Course).join(User)

        if search:
            search_value = f"%{search}%"
            query = query.filter(
                db.or_(
                    CourseBatch.batch_code.ilike(search_value),
                    CourseBatch.batch_name.ilike(search_value),
                    Course.course_code.ilike(search_value),
                    Course.course_name.ilike(search_value),
                    User.first_name.ilike(search_value),
                    User.last_name.ilike(search_value)
                )
            )

        if course_id:
            query = query.filter(CourseBatch.course_id == course_id)

        if status:
            query = query.filter(CourseBatch.status == status)

        batches = query.order_by(CourseBatch.created_at.desc()).all()
        return [AdminCourseBatchService.format_batch(batch) for batch in batches]

    @staticmethod
    def get_batch_by_id(batch_id):
        batch = CourseBatch.query.get(batch_id)

        if not batch:
            return None, "Course batch not found"

        return AdminCourseBatchService.format_batch(batch), None

    @staticmethod
    def create_batch(data, created_by_user_id=None):
        course_id = data.get("course_id")
        coordinator_id = data.get("coordinator_id")

        batch_code = data.get("batch_code", "").strip().upper()
        batch_name = data.get("batch_name", "").strip()

        start_date = data.get("start_date")
        end_date = data.get("end_date")
        application_deadline = data.get("application_deadline")
        capacity = data.get("capacity")

        status = data.get("status", "Open")

        validation_error = AdminCourseBatchService.validate_batch_data(
            course_id,
            coordinator_id,
            batch_code,
            batch_name,
            start_date,
            end_date,
            application_deadline,
            capacity
        )

        if validation_error:
            return None, validation_error

        existing_code = CourseBatch.query.filter_by(batch_code=batch_code).first()

        if existing_code:
            return None, "Batch code already exists"

        batch = CourseBatch(
            course_id=course_id,
            coordinator_id=coordinator_id,
            batch_code=batch_code,
            batch_name=batch_name,
            start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
            end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
            application_deadline=datetime.strptime(application_deadline, "%Y-%m-%d").date(),
            capacity=int(capacity),
            status=status,
            is_active=True
        )

        db.session.add(batch)
        db.session.flush()

        AdminCourseBatchService.create_audit_log(
            created_by_user_id,
            "CREATE_COURSE_BATCH",
            f"Created batch {batch.batch_code} for course {batch.course.course_code}"
        )

        db.session.commit()

        return AdminCourseBatchService.format_batch(batch), None

    @staticmethod
    def update_batch(batch_id, data, updated_by_user_id=None):
        batch = CourseBatch.query.get(batch_id)

        if not batch:
            return None, "Course batch not found"

        course_id = data.get("course_id", batch.course_id)
        coordinator_id = data.get("coordinator_id", batch.coordinator_id)

        batch_code = data.get("batch_code", batch.batch_code).strip().upper()
        batch_name = data.get("batch_name", batch.batch_name).strip()

        start_date = data.get("start_date", batch.start_date.strftime("%Y-%m-%d"))
        end_date = data.get("end_date", batch.end_date.strftime("%Y-%m-%d"))
        application_deadline = data.get(
            "application_deadline",
            batch.application_deadline.strftime("%Y-%m-%d")
        )

        capacity = data.get("capacity", batch.capacity)
        status = data.get("status", batch.status)

        validation_error = AdminCourseBatchService.validate_batch_data(
            course_id,
            coordinator_id,
            batch_code,
            batch_name,
            start_date,
            end_date,
            application_deadline,
            capacity
        )

        if validation_error:
            return None, validation_error

        existing_code = CourseBatch.query.filter(
            CourseBatch.batch_code == batch_code,
            CourseBatch.id != batch_id
        ).first()

        if existing_code:
            return None, "Batch code already exists"

        batch.course_id = course_id
        batch.coordinator_id = coordinator_id
        batch.batch_code = batch_code
        batch.batch_name = batch_name
        batch.start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        batch.end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        batch.application_deadline = datetime.strptime(application_deadline, "%Y-%m-%d").date()
        batch.capacity = int(capacity)
        batch.status = status

        AdminCourseBatchService.create_audit_log(
            updated_by_user_id,
            "UPDATE_COURSE_BATCH",
            f"Updated batch {batch.batch_code}"
        )

        db.session.commit()

        return AdminCourseBatchService.format_batch(batch), None

    @staticmethod
    def update_batch_status(batch_id, is_active, updated_by_user_id=None):
        batch = CourseBatch.query.get(batch_id)

        if not batch:
            return None, "Course batch not found"

        batch.is_active = bool(is_active)

        if not batch.is_active:
            batch.status = "Closed"

        action = "ACTIVATE_COURSE_BATCH" if batch.is_active else "DEACTIVATE_COURSE_BATCH"

        AdminCourseBatchService.create_audit_log(
            updated_by_user_id,
            action,
            f"{action}: {batch.batch_code}"
        )

        db.session.commit()

        return AdminCourseBatchService.format_batch(batch), None

    @staticmethod
    def get_coordinators():
        coordinators = (
            User.query
            .join(Role)
            .filter(Role.name == "Department Staff", User.is_active == True)
            .order_by(User.first_name.asc())
            .all()
        )

        return [
            {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email
            }
            for user in coordinators
        ]

    @staticmethod
    def validate_batch_data(
        course_id,
        coordinator_id,
        batch_code,
        batch_name,
        start_date,
        end_date,
        application_deadline,
        capacity
    ):
        if not course_id:
            return "Course is required"

        course = Course.query.get(course_id)

        if not course:
            return "Invalid course selected"

        if not course.is_active:
            return "Only active courses can have batches"

        if not coordinator_id:
            return "Course coordinator is required"

        coordinator = User.query.get(coordinator_id)

        if not coordinator:
            return "Invalid course coordinator selected"

        if not coordinator.is_active:
            return "Selected coordinator is inactive"

        if coordinator.role.name != "Department Staff":
            return "Course coordinator must be Department Staff"

        if not batch_code:
            return "Batch code is required"

        if not batch_name:
            return "Batch name is required"

        if not start_date:
            return "Start date is required"

        if not end_date:
            return "End date is required"

        if not application_deadline:
            return "Application deadline is required"

        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            deadline = datetime.strptime(application_deadline, "%Y-%m-%d").date()
        except ValueError:
            return "Invalid date format. Use YYYY-MM-DD"

        if end <= start:
            return "End date must be after start date"

        if deadline >= start:
            return "Application deadline must be before batch start date"

        if capacity is None or int(capacity) <= 0:
            return "Capacity must be greater than 0"

        return None

    @staticmethod
    def format_batch(batch):
        return {
            "id": batch.id,
            "course_id": batch.course_id,
            "coordinator_id": batch.coordinator_id,
            "batch_code": batch.batch_code,
            "batch_name": batch.batch_name,
            "start_date": batch.start_date.isoformat() if batch.start_date else None,
            "end_date": batch.end_date.isoformat() if batch.end_date else None,
            "application_deadline": batch.application_deadline.isoformat()
            if batch.application_deadline else None,
            "capacity": batch.capacity,
            "status": batch.status,
            "is_active": batch.is_active,
            "course": {
                "id": batch.course.id,
                "course_code": batch.course.course_code,
                "course_name": batch.course.course_name
            } if batch.course else None,
            "coordinator": {
                "id": batch.coordinator.id,
                "first_name": batch.coordinator.first_name,
                "last_name": batch.coordinator.last_name,
                "email": batch.coordinator.email
            } if batch.coordinator else None,
            "created_at": batch.created_at.isoformat() if batch.created_at else None,
            "updated_at": batch.updated_at.isoformat() if batch.updated_at else None
        }

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )
        db.session.add(log)