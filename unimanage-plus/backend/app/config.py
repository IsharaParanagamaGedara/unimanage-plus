import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Security
    SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # Database
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "app", "static", "uploads")

    COURSE_MATERIAL_FOLDER = os.path.join(
        UPLOAD_FOLDER,
        "course_materials"
    )

    # Maximum Upload Size = 20MB
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024