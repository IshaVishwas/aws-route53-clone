from datetime import datetime
from typing import Optional, List
import ipaddress
import re
from pydantic import BaseModel, Field, field_validator, model_validator

ALLOWED_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


def _normalize_record_name(name: str) -> str:
    """Lowercase, strip, and ensure DNS name is clean."""
    cleaned = name.strip().lower()
    if cleaned and not cleaned.endswith("."):
        cleaned += "."
    return cleaned


class DNSRecordCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="DNS record name")
    type: str = Field(..., description="Record type: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA")
    ttl: int = Field(300, ge=1, le=2147483647, description="Time to live in seconds")
    value: str = Field(..., min_length=1, max_length=4096, description="Record value / target")
    priority: Optional[int] = Field(None, ge=0, le=65535, description="Priority for MX/SRV records")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Record name cannot be empty")
        return _normalize_record_name(v)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ALLOWED_RECORD_TYPES:
            raise ValueError(
                f"Unsupported record type '{v}'. Allowed types: {', '.join(sorted(ALLOWED_RECORD_TYPES))}"
            )
        return v

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Record value cannot be empty")
        return v

    @model_validator(mode="after")
    def validate_type_specific_rules(self) -> "DNSRecordCreate":
        rtype = self.type
        val = self.value.strip()

        if rtype == "A":
            try:
                ip = ipaddress.IPv4Address(val)
                self.value = str(ip)
            except ValueError:
                raise ValueError(f"Invalid IPv4 address format for A record: '{val}'")

        elif rtype == "AAAA":
            try:
                ip = ipaddress.IPv6Address(val)
                self.value = str(ip)
            except ValueError:
                raise ValueError(f"Invalid IPv6 address format for AAAA record: '{val}'")

        elif rtype in ("MX", "SRV"):
            if self.priority is None:
                # Default sensible priority if omitted
                self.priority = 10

        return self


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    ttl: Optional[int] = Field(None, ge=1, le=2147483647)
    value: Optional[str] = Field(None, min_length=1, max_length=4096)
    priority: Optional[int] = Field(None, ge=0, le=65535)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().lower()
            if not v:
                raise ValueError("Record name cannot be empty")
            return _normalize_record_name(v)
        return v

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Record value cannot be empty")
            return v
        return v


class DNSRecordResponse(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    ttl: int
    value: str
    priority: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
