from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models.models import Project, Repository, TeamMember, User
from backend.schemas.project import ProjectCreate, ProjectResponse, RepositoryCreate, RepositoryResponse
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find all teams the user is member of
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    
    # Query projects for those teams
    projects = db.query(Project).filter(Project.team_id.in_(user_team_ids)).all()
    return projects

@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user has access to this team
    is_member = db.query(TeamMember).filter(
        TeamMember.team_id == project_in.team_id,
        TeamMember.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to create projects in this team")
        
    project = Project(
        name=project_in.name,
        description=project_in.description,
        team_id=project_in.team_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Verify user team membership
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    if project.team_id not in user_team_ids:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return project

@router.post("/{project_id}/repositories", response_model=RepositoryResponse)
def add_repository(
    project_id: int,
    repo_in: RepositoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Verify user team membership
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    if project.team_id not in user_team_ids:
        raise HTTPException(status_code=403, detail="Access denied")
        
    repository = Repository(
        project_id=project_id,
        name=repo_in.name,
        url=repo_in.url,
        provider=repo_in.provider,
        default_branch=repo_in.default_branch
    )
    db.add(repository)
    db.commit()
    db.refresh(repository)
    return repository
