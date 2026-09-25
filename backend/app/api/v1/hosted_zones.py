import secrets
import string
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User
from app.models.hosted_zone import HostedZone
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZoneListResponse,
)

from app.models.dns_record import DNSRecord

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])


def _generate_zone_id() -> str:
    """Generate an AWS-style hosted zone ID (e.g. Z1D633PJN98FT9)."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(chars) for _ in range(13))
    return f"Z{suffix}"


def _zone_to_response(db: DbSession, zone: HostedZone) -> HostedZoneResponse:
    """Map a HostedZone ORM instance to a response schema with live record_count."""
    count_stmt = select(func.count(DNSRecord.id)).where(
        DNSRecord.hosted_zone_id == zone.id
    )
    count = db.scalar(count_stmt) or 0
    return HostedZoneResponse(
        id=zone.id,
        zone_id=zone.zone_id,
        name=zone.name,
        type=zone.type,
        comment=zone.comment,
        private_zone=zone.private_zone,
        record_count=count,
        created_at=zone.created_at,
        updated_at=zone.updated_at,
    )


# ---------------------------------------------------------------------------
# GET /hosted-zones  – list with search, type filter, pagination
# ---------------------------------------------------------------------------
@router.get("", response_model=HostedZoneListResponse)
def list_hosted_zones(
    search: Optional[str] = Query(None, max_length=255),
    type: Optional[str] = Query(None, description="PUBLIC or PRIVATE"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List all hosted zones with optional search, type filter, and pagination."""
    stmt = select(HostedZone)

    # Search filter – matches zone name (starts-with / contains)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(HostedZone.name).like(term),
            )
        )

    # Type filter
    if type and type.strip().upper() in ("PUBLIC", "PRIVATE"):
        stmt = stmt.where(HostedZone.type == type.strip().upper())

    # Total count (before pagination)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Order and paginate
    stmt = (
        stmt.order_by(HostedZone.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    zones = db.scalars(stmt).all()

    total_pages = max(1, -(-total // page_size))  # ceiling division

    return HostedZoneListResponse(
        items=[_zone_to_response(db, z) for z in zones],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# GET /hosted-zones/{zone_id}
# ---------------------------------------------------------------------------
@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Retrieve a single hosted zone by its UUID or AWS-style zone_id."""
    zone = _find_zone(db, zone_id)
    return _zone_to_response(db, zone)


# ---------------------------------------------------------------------------
# POST /hosted-zones
# ---------------------------------------------------------------------------
@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Create a new hosted zone. Returns 409 if domain name already exists."""
    # Check for duplicate name
    existing = db.scalar(
        select(HostedZone).where(
            func.lower(HostedZone.name) == payload.name.lower()
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A hosted zone for '{payload.name}' already exists.",
        )

    zone = HostedZone(
        zone_id=_generate_zone_id(),
        name=payload.name,
        type=payload.type,
        comment=payload.comment,
        private_zone=payload.private_zone,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return _zone_to_response(db, zone)


# ---------------------------------------------------------------------------
# PUT /hosted-zones/{zone_id}
# ---------------------------------------------------------------------------
@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    payload: HostedZoneUpdate,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Update an existing hosted zone's editable fields (comment only)."""
    zone = _find_zone(db, zone_id)
    zone.comment = payload.comment
    zone.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(zone)
    return _zone_to_response(db, zone)


# ---------------------------------------------------------------------------
# DELETE /hosted-zones/{zone_id}
# ---------------------------------------------------------------------------
@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hosted_zone(
    zone_id: str,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Permanently delete a hosted zone. DNS records are not yet implemented."""
    zone = _find_zone(db, zone_id)
    db.delete(zone)
    db.commit()


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------
def _find_zone(db: DbSession, zone_id: str) -> HostedZone:
    """Lookup by UUID or AWS-style zone_id. Raises 404 if not found."""
    stmt = select(HostedZone).where(
        or_(HostedZone.id == zone_id, HostedZone.zone_id == zone_id)
    )
    zone = db.scalar(stmt)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )
    return zone
