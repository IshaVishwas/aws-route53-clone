from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, generate_session_token
from app.models.auth import User, Session
from app.schemas.auth import (
    LoginRequest,
    SessionResponse,
    UserResponse,
    MessageResponse,
)
from app.api.deps import get_current_session

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=SessionResponse)
def login(payload: LoginRequest, db: DbSession = Depends(get_db)):
    """Authenticate user credentials and create a persistent session."""
    email_clean = payload.email.lower().strip()
    stmt = select(User).where(User.email == email_clean)
    user = db.scalar(stmt)

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create new session
    token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    session_record = Session(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db.add(session_record)
    db.commit()
    db.refresh(session_record)

    return SessionResponse(
        user=UserResponse.model_validate(user),
        token=session_record.token,
        expires_at=session_record.expires_at,
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    session_record: Session = Depends(get_current_session),
    db: DbSession = Depends(get_db),
):
    """Invalidate and remove current active session."""
    db.delete(session_record)
    db.commit()
    return MessageResponse(message="Successfully logged out")


@router.get("/session", response_model=SessionResponse)
def get_session(
    session_record: Session = Depends(get_current_session),
):
    """Validate current session token and return authenticated user."""
    return SessionResponse(
        user=UserResponse.model_validate(session_record.user),
        token=session_record.token,
        expires_at=session_record.expires_at,
    )
