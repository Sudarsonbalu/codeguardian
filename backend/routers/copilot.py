import os
import glob
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.routers.auth import get_current_user
from backend.models.models import User
from backend.config import settings

router = APIRouter(prefix="/copilot", tags=["copilot"])

class CopilotQueryRequest(BaseModel):
    query: str

def get_workspace_files() -> Dict[str, str]:
    files = {}
    # Read files in backend and frontend to form codebase context
    for pattern in ["backend/**/*.py", "frontend/src/**/*.tsx", "frontend/src/**/*.ts"]:
        for path in glob.glob(pattern, recursive=True):
            if os.path.isfile(path) and "venv" not in path and "node_modules" not in path and ".next" not in path:
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        files[path] = f.read()[:2000] # Limit size per file for context limits
                except Exception:
                    pass
    return files

@router.post("/query")
async def query_copilot(req: CopilotQueryRequest, current_user: User = Depends(get_current_user)):
    query = req.query.lower().strip()
    
    # 1. Gather local codebase context
    codebase = get_workspace_files()
    
    # If OpenAI API Key is configured, use it for full repo analysis
    if settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            context_lines = []
            for path, content in codebase.items():
                context_lines.append(f"File: {path}\n```\n{content}\n```\n")
            context = "\n".join(context_lines)[:12000] # Cap total context size
            
            system_prompt = (
                "You are CodeGuardian AI Copilot, a Staff Engineer and codebase architect. "
                "You have access to files from the project. Answer the user's question with deep code details, "
                "specific file references, and actionable recommendations. Always maintain a premium, professional developer tone."
            )
            user_prompt = f"Codebase Context:\n{context}\n\nUser Question: {req.query}"
            
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            return {"answer": completion.choices[0].message.content}
        except Exception as e:
            # Fall back to heuristic rule engine if OpenAI fails
            pass

    # 2. Local rule-based engine fallback
    if "auth" in query or "login" in query or "register" in query:
        files_found = [p for p in codebase.keys() if "auth" in p.lower()]
        return {
            "answer": (
                "### 🔐 Codebase Authentication Architecture\n\n"
                "The authentication system is implemented in both the frontend and backend using JWT (JSON Web Tokens):\n\n"
                "1. **Backend Service** (`backend/services/auth_service.py` & `backend/routers/auth.py`):\n"
                "   - Uses standard OAuth2 authorization flow with Bearer tokens.\n"
                "   - JWT verification is handled by the dependency `get_current_user` in `backend/routers/auth.py`.\n"
                "   - Database hashing is done via `passlib[bcrypt]` and `bcrypt`.\n\n"
                "2. **Frontend State** (`frontend/src/store/authStore.ts`):\n"
                "   - Utilizes `Zustand` store for global authentication state management.\n"
                "   - Tokens and user payloads are safely synchronized to local storage under SSR safety guards.\n\n"
                "**Relevant files discovered:**\n" + 
                "\n".join([f"- [{os.path.basename(p)}](file:///{os.path.abspath(p).replace(os.sep, '/')})" for p in files_found])
            )
        }
    
    if "duplicate" in query or "dead code" in query or "redundant" in query:
        # Simple heuristic search for duplicate function names
        funcs = {}
        duplicates = []
        for path, content in codebase.items():
            for line in content.split("\n"):
                if "def " in line or "const " in line and "=>" in line:
                    parts = line.strip().split(" ")
                    for p in parts:
                        if "(" in p:
                            name = p.split("(")[0]
                            if len(name) > 3 and name not in ["__init__", "get_db", "main"]:
                                if name in funcs:
                                    duplicates.append((name, funcs[name], path))
                                else:
                                    funcs[name] = path
        
        answer = "### 🔍 Repository Code Quality Insights\n\n"
        if duplicates:
            answer += "Found potential duplicate code or duplicate naming structures:\n\n"
            for name, p1, p2 in duplicates[:5]:
                answer += f"- **Symbol:** `{name}` is defined in both:\n"
                answer += f"  - [{os.path.basename(p1)}](file:///{os.path.abspath(p1).replace(os.sep, '/')})\n"
                answer += f"  - [{os.path.basename(p2)}](file:///{os.path.abspath(p2).replace(os.sep, '/')})\n\n"
        else:
            answer += "No duplicate method declarations or dead structures detected via local heuristics. Codebase is clean.\n"
        return {"answer": answer}

    if "architecture" in query or "folder" in query or "structure" in query:
        return {
            "answer": (
                "### 🏗️ CodeGuardian Project Architecture\n\n"
                "The project is structured as a classic modern Web application:\n\n"
                "- **FastAPI Backend (`/backend`)**:\n"
                "  - `main.py`: Entrypoint containing middle-wares (rate limiter, error handler) and router registries.\n"
                "  - `routers/`: Controller layers mapping REST and WebSocket protocols.\n"
                "  - `services/`: Core logic layer containing agent orchestration (`orchestrator.py`) and specialized AST static scanners.\n"
                "  - `models/`: SQLAlchemy database schema representations mapping SQLite/PostgreSQL relationships.\n\n"
                "- **Next.js Frontend (`/frontend`)**:\n"
                "  - App Router structure containing folders `/dashboard`, `/projects`, `/review` (Monaco workspace), `/teams`.\n"
                "  - `components/`: Shareable components including `DashboardLayout`, `DiffViewer`, and Monaco workspace panels.\n"
                "  - `store/`: Zustand state hooks coordinating client status.\n"
            )
        }

    # Default fallback answer
    return {
        "answer": (
            f"### 🤖 CodeGuardian AI Repository Copilot\n\n"
            f"I scanned your workspace containing **{len(codebase)} files**.\n\n"
            f"To answer your request: *\"{req.query}\"*, I recommend analyzing these key files:\n" +
            "\n".join([f"- [{os.path.basename(p)}](file:///{os.path.abspath(p).replace(os.sep, '/')})" for p in list(codebase.keys())[:5]]) +
            "\n\n*Configure a valid `OPENAI_API_KEY` in `backend/.env` to get full repository-wide semantic reasoning.*"
        )
    }
