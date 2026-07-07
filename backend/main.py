import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base
from backend.models import models
from backend.seed import seed_database
from backend.config import settings
from backend.routers import auth, projects, reviews, teams, analytics, notifications, websockets
from backend.routers import github, ai_tools, health, terminal, git, copilot, enterprise_tools

try:
    Base.metadata.create_all(bind=engine)
    seed_database()
except Exception as e:
    print(f"Database initialization note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Code Review & Developer Platform",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom sliding window rate-limiting middleware
import time
from fastapi import Request
from fastapi.responses import JSONResponse

RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100
request_history = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
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
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Existing routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(auth.router) # Prefixless routing for OAuth callbacks
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(websockets.router)

# Phase 2 new routers
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
