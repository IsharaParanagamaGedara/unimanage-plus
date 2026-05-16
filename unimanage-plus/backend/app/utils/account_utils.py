import random
import string

def generate_temp_password(prefix="Tmp"):
    random_part = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    return f"{prefix}@{random_part}"

def generate_academic_email(first_name, last_name, role_name):
    first = first_name.lower().strip().replace(" ", "")
    last = last_name.lower().strip().replace(" ", "")

    role_map = {
        "Student": "student",
        "Lecturer": "lecturer",
        "Department Staff": "staff",
        "Admin": "admin"
    }

    role_part = role_map.get(role_name, "user")

    return f"{first}.{last}.{role_part}@unimanage.edu"

def generate_student_number(user_id):
    return f"STU{user_id:05d}"

def generate_staff_number(user_id, prefix="STA"):
    return f"{prefix}{user_id:05d}"