from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re


def _normalize_domain(name: str) -> str:
    """Lowercase and ensure the domain ends with a trailing dot."""
    name = name.strip().lower()
    if name and not name.endswith("."):
        name = name + "."
    return name


class HostedZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Fully qualified domain name")
    type: str = Field("PUBLIC", description="PUBLIC or PRIVATE")
    comment: Optional[str] = Field(None, max_length=1000)
    private_zone: bool = Field(False)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Domain name cannot be empty")
        # Strip trailing dot for validation, re-add after
        check = v.rstrip(".")
        # Basic FQDN pattern check
        pattern = r"^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$"
        if not re.match(pattern, check):
            raise ValueError(
                "Invalid domain name. Use a valid FQDN like 'example.com' or 'sub.example.com'."
            )
        return _normalize_domain(v)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ("PUBLIC", "PRIVATE"):
            raise ValueError("type must be 'PUBLIC' or 'PRIVATE'")
        return v

    def model_post_init(self, __context) -> None:
        if self.type == "PRIVATE":
            self.private_zone = True
        elif self.private_zone:
            self.type = "PRIVATE"
        else:
            self.type = "PUBLIC"
            self.private_zone = False


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = Field(None, max_length=1000)
    # Name and type intentionally omitted – AWS does not allow changing these after creation


class HostedZoneResponse(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    comment: Optional[str]
    private_zone: bool
    record_count: int = 0  # Will be populated from DNS records count in Phase 5
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
