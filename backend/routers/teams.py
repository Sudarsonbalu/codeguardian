from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import smtplib
from email.mime.text import MIMEText
import logging

logger = logging.getLogger(__name__)

def send_email_invitation(email: str, team_name: str, role: str):
    print(f"[MAIL DISPATCH] Dispatching team invitation email to: '{email}' for team: '{team_name}' (Role: {role})")
    try:
        msg = MIMEText(f"Hello, you have been invited to join the team '{team_name}' on CodeGuardian AI as {role}!")
        msg['Subject'] = f"CodeGuardian AI Invitation: {team_name}"
        msg['From'] = "noreply@codeguardian.ai"
        msg['To'] = email
        
        with smtplib.SMTP('localhost', 1025, timeout=1.0) as server:
            server.send_message(msg)
            print(f"[MAIL DISPATCH] Invitation email successfully sent to '{email}'!")
    except Exception as e:
        logger.warning(f"Could not send team invitation mail via SMTP: {e}")

from backend.database import get_db
from backend.models.models import Team, TeamMember, User, AuditLog, MemberRole
from backend.schemas.team import TeamResponse, TeamCreate, TeamMemberResponse, TeamMemberCreate, AuditLogResponse
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("/", response_model=List[TeamResponse])
def list_user_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    teams = db.query(Team).join(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    return teams

@router.post("/", response_model=TeamResponse)
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = Team(name=team_in.name)
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add creator as Admin
    member = TeamMember(team_id=team.id, user_id=current_user.id, role=MemberRole.ADMIN)
    db.add(member)
    
    # Create audit log
    log = AuditLog(team_id=team.id, user_id=current_user.id, action="CREATE_TEAM", details=f"Team '{team.name}' created.")
    db.add(log)
    
    db.commit()
    return team

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def list_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user is in this team
    is_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied")
        
    members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    
    # Let's populate the user objects dynamically or nested in response schema
    # (Since SQLAlchemy relationship is user, Pydantic gets user field automagically)
    # We can attach the email / full_name to the response
    res = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        item = {
            "id": m.id,
            "team_id": m.team_id,
            "user_id": m.user_id,
            "role": m.role,
            "created_at": m.created_at,
            "user": {
                "email": u.email,
                "full_name": u.full_name,
                "avatar_url": u.avatar_url
            } if u else None
        }
        res.append(item)
    return res

@router.post("/{team_id}/members", response_model=TeamMemberResponse)
def invite_member(
    team_id: int,
    member_in: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify current user is admin in this team
    current_role = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    if not current_role or current_role.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only workspace admins can invite new members")
        
    # Check if user already exists
    user = db.query(User).filter(User.email == member_in.email).first()
    if not user:
        # Create a skeleton user or mock invite
        user = User(
            email=member_in.email,
            full_name=member_in.email.split("@")[0],
            avatar_url=f"https://api.dicebear.com/7.x/adventurer/svg?seed={member_in.email}",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Check if already a member
    existing_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user.id
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this team")
        
    member = TeamMember(
        team_id=team_id,
        user_id=user.id,
        role=member_in.role
    )
    db.add(member)
    
    log = AuditLog(
        team_id=team_id,
        user_id=current_user.id,
        action="INVITE_MEMBER",
        details=f"Invited user '{member_in.email}' as role '{member_in.role}'."
    )
    db.add(log)
    
    db.commit()
    db.refresh(member)
    
    # Try sending email
    team = db.query(Team).filter(Team.id == team_id).first()
    team_name = team.name if team else "Workspace Team"
    send_email_invitation(member_in.email, team_name, member_in.role)
    
    return member

@router.get("/{team_id}/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify membership
    is_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied")
        
    logs = db.query(AuditLog).filter(AuditLog.team_id == team_id).order_by(AuditLog.created_at.desc()).all()
    return logs

@router.delete("/{team_id}/members/{member_id}")
def delete_team_member(
    team_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify current user is admin in this team
    current_role = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()
    if not current_role or current_role.role != MemberRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only workspace admins can remove members")
        
    # Get member to delete
    member = db.query(TeamMember).filter(
        TeamMember.id == member_id,
        TeamMember.team_id == team_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    # Prevent deleting oneself
    if member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot remove themselves from their workspace team")
        
    user_email = db.query(User.email).filter(User.id == member.user_id).scalar() or "Unknown"
    
    # Delete
    db.delete(member)
    
    # Audit log
    log = AuditLog(
        team_id=team_id,
        user_id=current_user.id,
        action="REMOVE_MEMBER",
        details=f"Removed user '{user_email}' from team."
    )
    db.add(log)
    db.commit()
    
    return {"status": "success", "message": f"Successfully removed member '{user_email}' from team."}
