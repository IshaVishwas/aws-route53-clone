from datetime import datetime
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    user: UserResponse
    token: str
    expires_at: datetime


class MessageResponse(BaseModel):
    message: str
