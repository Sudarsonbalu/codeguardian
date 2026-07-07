"""Health check router for production monitoring."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.database import get_db
import datetime

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
def health_check():
    return {"status": "healthy", "service": "CodeGuardian AI", "timestamp": datetime.datetime.utcnow().isoformat()}

@router.get("/db")
def database_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

@router.get("/ready")
def readiness_check():
    return {"status": "ready", "timestamp": datetime.datetime.utcnow().isoformat()}
