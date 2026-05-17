from flask import Flask
from app.config import Config
from app.extensions import db, migrate, jwt, cors

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)

    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from app.routes.admin_user_routes import admin_user_bp
    app.register_blueprint(admin_user_bp, url_prefix="/api/admin")

    from app.routes.admin_department_routes import admin_department_bp
    app.register_blueprint(admin_department_bp, url_prefix="/api/admin")

    from app.routes.admin_course_routes import admin_course_bp
    app.register_blueprint(admin_course_bp, url_prefix="/api/admin")

    from app.routes.course_material_routes import course_material_bp
    app.register_blueprint(course_material_bp, url_prefix="/api/admin")

    @app.route("/api/health")
    def health_check():
        return {
            "success": True,
            "message": "UniManage Plus backend is running"
        }, 200

    return app