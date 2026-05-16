from flask_jwt_extended import create_access_token
from app.models.user import User
from app.models.audit_log import AuditLog
from app.extensions import db

class AuthService:

    @staticmethod
    def login(email, password):
        user = User.query.filter_by(email=email).first()

        if not user:
            return None, "Invalid email or password"

        if not user.check_password(password):
            AuthService.create_audit_log(
                None,
                "FAILED_LOGIN",
                f"Failed login attempt for email: {email}"
            )
            return None, "Invalid email or password"

        if not user.is_active:
            return None, "Your account is inactive. Please contact administrator."

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role.name,
                "email": user.email
            }
        )

        AuthService.create_audit_log(
            user.id,
            "LOGIN",
            f"{user.email} logged into the system"
        )

        return {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role.name
            }
        }, None

    @staticmethod
    def create_audit_log(user_id, action, description):
        log = AuditLog(
            user_id=user_id,
            action=action,
            description=description
        )

        db.session.add(log)
        db.session.commit()