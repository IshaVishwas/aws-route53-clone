import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class HostedZone(Base):
    """SQLAlchemy model for a Route 53 hosted zone."""

    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # AWS-style zone ID e.g. Z1D633PJN98FT9
    zone_id: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    # "PUBLIC" or "PRIVATE"
    type: Mapped[str] = mapped_column(String(10), nullable=False, default="PUBLIC")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    private_zone: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship: One HostedZone has many DNSRecords
    dns_records: Mapped[list["DNSRecord"]] = relationship(
        "DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan"
    )
