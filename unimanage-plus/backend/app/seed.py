from app import create_app
from app.extensions import db
from app.models.role import Role
from app.models.user import User

app = create_app()

with app.app_context():

    roles = ["Admin", "Lecturer", "Student", "Department Staff"]

    for role_name in roles:
        existing_role = Role.query.filter_by(name=role_name).first()

        if not existing_role:
            role = Role(name=role_name)
            db.session.add(role)

    db.session.commit()

    admin_role = Role.query.filter_by(name="Admin").first()

    existing_admin = User.query.filter_by(email="admin@unimanage.com").first()

    if not existing_admin:
        admin = User(
            first_name="System",
            last_name="Admin",
            email="admin@unimanage.com",
            role_id=admin_role.id,
            is_active=True
        )
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()

    print("Seed data inserted successfully.")