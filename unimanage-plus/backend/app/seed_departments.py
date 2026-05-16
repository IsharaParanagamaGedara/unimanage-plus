from app import create_app
from app.extensions import db
from app.models.department import Department

app = create_app()

with app.app_context():
    departments = [
        {
            "name": "School of Computing",
            "code": "SOC",
            "description": "Computing, software engineering, data science, and IT programmes."
        },
        {
            "name": "School of Business",
            "code": "SOB",
            "description": "Business management, accounting, marketing, and entrepreneurship programmes."
        },
        {
            "name": "School of Engineering",
            "code": "SOE",
            "description": "Engineering and technology related programmes."
        }
    ]

    for item in departments:
        existing = Department.query.filter_by(code=item["code"]).first()

        if not existing:
            department = Department(
                name=item["name"],
                code=item["code"],
                description=item["description"],
                is_active=True
            )
            db.session.add(department)

    db.session.commit()
    print("Departments seeded successfully.")