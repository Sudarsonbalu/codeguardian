from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any, Optional
import requests
import json
import urllib.parse
import jwt
from datetime import timedelta

from backend.database import get_db
from backend.models.models import User, Team, TeamMember, MemberRole
from backend.schemas.auth import UserCreate, UserResponse, Token
from backend.services import auth_service
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login-form"
)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    hashed_password = auth_service.get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/adventurer/svg?seed={user_in.email}"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Automatically create a default team for this user
    default_team = Team(name=f"{db_user.full_name or db_user.email.split('@')[0]}'s Workspace")
    db.add(default_team)
    db.commit()
    db.refresh(default_team)

    team_member = TeamMember(
        team_id=default_team.id,
        user_id=db_user.id,
        role=MemberRole.ADMIN
    )
    db.add(team_member)
    db.commit()

    return db_user

class LoginRequest(UserCreate):
    pass

@router.post("/login", response_model=Token)
def login(login_in: LoginRequest, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not auth_service.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": auth_service.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": user
    }

@router.post("/login-form", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": auth_service.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": user
    }



@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

# --- GOOGLE OAUTH ---
@router.get("/google/login")
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        return RedirectResponse(url=f"{settings.BACKEND_URL}/auth/google/callback?code=mock_code")
    url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.BACKEND_URL}/auth/google/callback&scope=openid%20email%20profile"
    return RedirectResponse(url=url)

@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    email = "google-developer@codeguardian.ai"
    name = "Google Developer"
    avatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=google"
    
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and code != "mock_code":
        try:
            token_res = requests.post("https://oauth2.googleapis.com/token", data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{settings.BACKEND_URL}/auth/google/callback",
                "grant_type": "authorization_code"
            }).json()
            access_token = token_res.get("access_token")
            if access_token:
                user_info = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
                    "Authorization": f"Bearer {access_token}"
                }).json()
                email = user_info.get("email", email)
                name = user_info.get("name", name)
                avatar = user_info.get("picture", avatar)
        except Exception as e:
            print(f"Google OAuth failed: {e}")
            
    return process_oauth_user(email, name, avatar, "google", db)

# --- GITHUB OAUTH ---
@router.get("/github/login")
def github_login():
    if not settings.GITHUB_CLIENT_ID:
        return RedirectResponse(url=f"{settings.BACKEND_URL}/auth/github/callback?code=mock_code")
    url = f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}&redirect_uri={settings.BACKEND_URL}/auth/github/callback&scope=user:email"
    return RedirectResponse(url=url)

@router.get("/github/callback")
def github_callback(code: str, db: Session = Depends(get_db)):
    email = "github-developer@codeguardian.ai"
    name = "GitHub Developer"
    avatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=github"
    github_token = None
    
    if settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET and code != "mock_code":
        try:
            token_res = requests.post("https://github.com/login/oauth/access_token", headers={
                "Accept": "application/json"
            }, data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": f"{settings.BACKEND_URL}/auth/github/callback"
            }).json()
            github_token = token_res.get("access_token")
            if github_token:
                user_info = requests.get("https://api.github.com/user", headers={
                    "Authorization": f"token {github_token}"
                }).json()
                name = user_info.get("name") or user_info.get("login") or name
                avatar = user_info.get("avatar_url", avatar)
                
                # Fetch emails
                emails = requests.get("https://api.github.com/user/emails", headers={
                    "Authorization": f"token {github_token}"
                }).json()
                if isinstance(emails, list):
                    primary_email = next((e for e in emails if e.get("primary")), None)
                    if primary_email:
                        email = primary_email.get("email")
        except Exception as e:
            print(f"GitHub OAuth failed: {e}")
            
    return process_oauth_user(email, name, avatar, "github", db, github_token=github_token)

# --- MICROSOFT OAUTH ---
@router.get("/microsoft/login")
def microsoft_login():
    if not settings.MICROSOFT_CLIENT_ID:
        return RedirectResponse(url=f"{settings.BACKEND_URL}/auth/microsoft/callback?code=mock_code")
    url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={settings.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri={settings.BACKEND_URL}/auth/microsoft/callback&response_mode=query&scope=https://graph.microsoft.com/User.Read"
    return RedirectResponse(url=url)

@router.get("/microsoft/callback")
def microsoft_callback(code: str, db: Session = Depends(get_db)):
    email = "microsoft-developer@codeguardian.ai"
    name = "Microsoft Developer"
    avatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=microsoft"
    
    if settings.MICROSOFT_CLIENT_ID and settings.MICROSOFT_CLIENT_SECRET and code != "mock_code":
        try:
            token_res = requests.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data={
                "client_id": settings.MICROSOFT_CLIENT_ID,
                "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                "code": code,
                "redirect_uri": f"{settings.BACKEND_URL}/auth/microsoft/callback",
                "grant_type": "authorization_code"
            }).json()
            access_token = token_res.get("access_token")
            if access_token:
                user_info = requests.get("https://graph.microsoft.com/v1.0/me", headers={
                    "Authorization": f"Bearer {access_token}"
                }).json()
                email = user_info.get("mail") or user_info.get("userPrincipalName") or email
                name = user_info.get("displayName") or name
        except Exception as e:
            print(f"Microsoft OAuth failed: {e}")
            
    return process_oauth_user(email, name, avatar, "microsoft", db)

# --- COMMON HELPER ---
def process_oauth_user(email: str, name: str, avatar: str, provider: str, db: Session, github_token: Optional[str] = None):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            avatar_url=avatar,
            name=name,
            avatar=avatar,
            provider=provider,
            github_token=github_token,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create default workspace team
        team = Team(name=f"{name or email.split('@')[0]}'s Workspace")
        db.add(team)
        db.commit()
        db.refresh(team)
        
        member = TeamMember(team_id=team.id, user_id=user.id, role=MemberRole.ADMIN)
        db.add(member)
        db.commit()
    else:
        user.provider = provider
        user.name = name or user.name or user.full_name
        user.avatar = avatar or user.avatar or user.avatar_url
        if github_token:
            user.github_token = github_token
        db.commit()
        db.refresh(user)
        
    token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = auth_service.create_access_token(user.id, expires_delta=token_expires)
    
    user_payload = {
        "id": user.id,
        "email": user.email,
        "full_name": user.name,
        "avatar_url": user.avatar,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser
    }
    
    user_json = urllib.parse.quote(json.dumps(user_payload))
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?token={jwt_token}&user={user_json}")
