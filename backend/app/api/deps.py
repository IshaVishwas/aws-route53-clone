from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.auth import User, Session


def get_token_from_header(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None),
) -> Optional[str]:
    """Extracts session token from Authorization or X-Session-Token header."""
    if x_session_token:
        return x_session_token.strip()

    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1].strip()
        elif len(parts) == 1:
            return parts[0].strip()

    return None


def get_current_session(
    token: Optional[str] = Depends(get_token_from_header),
    db: DbSession = Depends(get_db),
) -> Session:
    """Validates session token and returns active Session model."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(Session).where(Session.token == token)
    session_record = db.scalar(stmt)

    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unrecognized session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration (ensure timezone-aware comparison)
    now = datetime.now(timezone.utc)
    expires_at = session_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        db.delete(session_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return session_record


def get_current_user(
    session_record: Session = Depends(get_current_session),
) -> User:
    """Dependency returning authenticated User for protected endpoints."""
    return session_record.user
