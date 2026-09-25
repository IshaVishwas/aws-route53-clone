from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.hosted_zones import router as hosted_zones_router
from app.api.v1.dns_records import router as dns_records_router

api_router = APIRouter()

# Include authentication endpoints
api_router.include_router(auth_router)
# Include hosted zones CRUD endpoints
api_router.include_router(hosted_zones_router)
# Include DNS records CRUD endpoints
api_router.include_router(dns_records_router)


@api_router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint validating API and SQLite connectivity."""
    db_status = "healthy"
    try:
        # Simple test query to ensure SQLite connection is alive
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
