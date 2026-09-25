from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.schemas.dns_record import (
    DNSRecordCreate,
    DNSRecordUpdate,
    DNSRecordResponse,
    DNSRecordListResponse,
    ALLOWED_RECORD_TYPES,
)

router = APIRouter(tags=["DNS Records"])


def _find_zone(db: DbSession, zone_id: str) -> HostedZone:
    """Find hosted zone by UUID or AWS-style zone_id. Raises 404 if missing."""
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


def _find_record(db: DbSession, record_id: str) -> DNSRecord:
    """Find DNS record by its UUID. Raises 404 if missing."""
    stmt = select(DNSRecord).where(DNSRecord.id == record_id)
    record = db.scalar(stmt)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS record '{record_id}' not found.",
        )
    return record


# ---------------------------------------------------------------------------
# GET /hosted-zones/{zone_id}/records – List records in a zone
# ---------------------------------------------------------------------------
@router.get(
    "/hosted-zones/{zone_id}/records",
    response_model=DNSRecordListResponse,
)
def list_records_for_zone(
    zone_id: str,
    search: Optional[str] = Query(None, max_length=255, description="Search by name or value"),
    type: Optional[str] = Query(None, description="Filter by DNS record type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """List DNS records inside a hosted zone with search, type filter, and pagination."""
    zone = _find_zone(db, zone_id)

    stmt = select(DNSRecord).where(DNSRecord.hosted_zone_id == zone.id)

    # Search filter (matches record name or value)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(DNSRecord.name).like(term),
                func.lower(DNSRecord.value).like(term),
            )
        )

    # Type filter (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA)
    if type and type.strip().upper() in ALLOWED_RECORD_TYPES:
        stmt = stmt.where(DNSRecord.type == type.strip().upper())

    # Total items count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Order and paginate (newest records first or sorted by name)
    stmt = (
        stmt.order_by(DNSRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    records = db.scalars(stmt).all()

    total_pages = max(1, -(-total // page_size))

    return DNSRecordListResponse(
        items=[DNSRecordResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# POST /hosted-zones/{zone_id}/records – Create record in a zone
# ---------------------------------------------------------------------------
@router.post(
    "/hosted-zones/{zone_id}/records",
    response_model=DNSRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_record_for_zone(
    zone_id: str,
    payload: DNSRecordCreate,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Create a new DNS record inside the specified hosted zone."""
    zone = _find_zone(db, zone_id)

    record = DNSRecord(
        hosted_zone_id=zone.id,
        name=payload.name,
        type=payload.type,
        ttl=payload.ttl,
        value=payload.value,
        priority=payload.priority,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


# ---------------------------------------------------------------------------
# GET /records/{record_id} – Retrieve a single record
# ---------------------------------------------------------------------------
@router.get(
    "/records/{record_id}",
    response_model=DNSRecordResponse,
)
def get_record(
    record_id: str,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Retrieve details of a single DNS record by its ID."""
    record = _find_record(db, record_id)
    return DNSRecordResponse.model_validate(record)


# ---------------------------------------------------------------------------
# PUT /records/{record_id} – Update a record
# ---------------------------------------------------------------------------
@router.put(
    "/records/{record_id}",
    response_model=DNSRecordResponse,
)
def update_record(
    record_id: str,
    payload: DNSRecordUpdate,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Update fields of an existing DNS record."""
    record = _find_record(db, record_id)

    if payload.name is not None:
        record.name = payload.name
    if payload.ttl is not None:
        record.ttl = payload.ttl
    if payload.value is not None:
        record.value = payload.value
    if payload.priority is not None:
        record.priority = payload.priority

    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


# ---------------------------------------------------------------------------
# DELETE /records/{record_id} – Delete a record
# ---------------------------------------------------------------------------
@router.delete(
    "/records/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_record(
    record_id: str,
    db: DbSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Permanently delete a DNS record."""
    record = _find_record(db, record_id)
    db.delete(record)
    db.commit()
