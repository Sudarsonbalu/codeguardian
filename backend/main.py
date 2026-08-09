import os
import sys
import time
import datetime
from typing import List

# Ensure parent and backend directories are in sys.path for Vercel & local execution
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import engine, Base
from backend.models import models
from backend.seed import seed_database
from backend.config import settings
from backend.routers import auth, projects, reviews, teams, analytics, notifications, websockets
from backend.routers import github, ai_tools, health, terminal, git, copilot, enterprise_tools

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Code Review & Developer Platform",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Safe lazy database initialization
_db_initialized = False

def init_db_safely():
    global _db_initialized
    if not _db_initialized:
        try:
            Base.metadata.create_all(bind=engine)
            seed_database()
            _db_initialized = True
        except Exception as e:
            print(f"Database initialization note: {e}")

@app.on_event("startup")
async def startup_event():
    init_db_safely()

# Configure production-ready CORS
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sliding window rate-limiting middleware (Vercel proxy compatible)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100
request_history: dict = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.headers.get("x-real-ip"):
        client_ip = request.headers.get("x-real-ip")
    else:
        client_ip = request.client.host if request.client else "unknown"

    current_time = time.time()
    
    if client_ip not in request_history:
        request_history[client_ip] = []
        
    request_history[client_ip] = [t for t in request_history[client_ip] if current_time - t < RATE_LIMIT_WINDOW]
    
    if len(request_history[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again in a minute."}
        )
        
    request_history[client_ip].append(current_time)
    return await call_next(request)

# Global error handling middleware
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(auth.router) # OAuth callbacks without prefix
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(websockets.router)

# Phase 2 routers
app.include_router(github.router, prefix=settings.API_V1_STR)
app.include_router(ai_tools.router, prefix=settings.API_V1_STR)
app.include_router(health.router)
app.include_router(terminal.router)
app.include_router(git.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(enterprise_tools.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "2.0.0",
        "docs": "/docs",
        "phase": "Enterprise AI Platform",
    }
