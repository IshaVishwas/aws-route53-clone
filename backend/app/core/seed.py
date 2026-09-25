import logging
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.auth import User
from app.core.security import hash_password

logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "admin@route53.aws"
DEMO_USER_PASSWORD = "AdminPassword123!"


def seed_demo_user(db: Session) -> User:
    """Seeds the development/demo user account if it doesn't already exist."""
    stmt = select(User).where(User.email == DEMO_USER_EMAIL)
    existing_user = db.scalar(stmt)

    if not existing_user:
        hashed = hash_password(DEMO_USER_PASSWORD)
        user = User(
            email=DEMO_USER_EMAIL,
            password_hash=hashed,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Seeded demo user account: {DEMO_USER_EMAIL}")
        return user

    return existing_user
