from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RepositoryBase(BaseModel):
    name: str
    url: str
    provider: str = "github"
    default_branch: str = "main"

class RepositoryCreate(RepositoryBase):
    pass

class RepositoryResponse(RepositoryBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    team_id: int

class ProjectResponse(ProjectBase):
    id: int
    team_id: int
    created_at: datetime
    updated_at: datetime
    repositories: List[RepositoryResponse] = []

    class Config:
        from_attributes = True
