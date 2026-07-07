from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from backend.models.models import MemberRole

class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TeamMemberBase(BaseModel):
    user_id: int
    role: MemberRole

class TeamMemberCreate(BaseModel):
    email: EmailStr
    role: MemberRole

class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    role: MemberRole
    created_at: datetime
    user: Optional[BaseModel] = None  # We will populate it or nest it

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    team_id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
