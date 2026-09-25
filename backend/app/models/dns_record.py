import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class DNSRecord(Base):
    """SQLAlchemy model for a DNS record inside a Route 53 hosted zone."""

    __tablename__ = "dns_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    hosted_zone_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )
    # Supported: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    type: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    ttl: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    # Optional priority for MX, SRV records
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    hosted_zone: Mapped["HostedZone"] = relationship(
        "HostedZone", back_populates="dns_records"
    )
