import os
import subprocess
import shutil
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.routers.auth import get_current_user
from backend.models.models import User

router = APIRouter(prefix="/git", tags=["git"])

class CommitRequest(BaseModel):
    message: str

class BranchCreateRequest(BaseModel):
    name: str

class CheckoutRequest(BaseModel):
    branch: str

# Check if git is available in system PATH
HAS_GIT = shutil.which("git") is not None

# In-memory mock git repository state for systems without git binary
mock_branches = ["main", "feature/login-fix", "develop"]
mock_current_branch = "main"
mock_changes = [
    {"status": "M", "file": "backend/seed.py"},
    {"status": "M", "file": "frontend/src/app/login/page.tsx"}
]
mock_commits = [
    {
        "hash": "b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0a1",
        "author": "Demo Developer",
        "date": "2026-07-07 10:00:00",
        "subject": "Initial commit"
    }
]

def run_git_command(args: List[str], cwd: str = ".") -> str:
    try:
        res = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return res.stdout
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Git Command Failed: {e.stderr or e.stdout}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Git Error: {str(e)}"
        )

@router.get("/status")
def git_status(current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        return {"changes": mock_changes}
    
    # Run git status in workspace
    output = run_git_command(["status", "--porcelain"])
    lines = output.strip().split("\n")
    changes = []
    for line in lines:
        if not line:
            continue
        parts = line.strip().split(" ", 1)
        status_code = parts[0]
        file_path = parts[1] if len(parts) > 1 else parts[0]
        changes.append({"status": status_code, "file": file_path})
    return {"changes": changes}

@router.get("/branches")
def git_branches(current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        return {"branches": mock_branches, "current": mock_current_branch}

    output = run_git_command(["branch", "-a"])
    lines = output.strip().split("\n")
    branches = []
    current = "main"
    for line in lines:
        line = line.strip()
        if line.startswith("*"):
            current = line.replace("*", "").strip()
            branches.append(current)
        else:
            branches.append(line)
    return {"branches": branches, "current": current}

@router.post("/checkout")
def git_checkout(req: CheckoutRequest, current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        global mock_current_branch
        if req.branch in mock_branches:
            mock_current_branch = req.branch
            return {"message": f"Switched to branch {req.branch}", "output": "Switched branch"}
        else:
            raise HTTPException(status_code=400, detail=f"Branch {req.branch} not found.")

    output = run_git_command(["checkout", req.branch])
    return {"message": f"Switched to branch {req.branch}", "output": output}

@router.post("/branch")
def git_create_branch(req: BranchCreateRequest, current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        global mock_current_branch
        if req.name not in mock_branches:
            mock_branches.append(req.name)
        mock_current_branch = req.name
        return {"message": f"Created and switched to branch {req.name}", "output": "Created branch"}

    output = run_git_command(["checkout", "-b", req.name])
    return {"message": f"Created and switched to branch {req.name}", "output": output}

@router.post("/commit")
def git_commit(req: CommitRequest, current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        global mock_changes, mock_commits
        if not mock_changes:
            raise HTTPException(status_code=400, detail="Nothing to commit, working tree clean.")
        
        # Generate a random commit hash
        import secrets
        commit_hash = secrets.token_hex(20)
        
        new_commit = {
            "hash": commit_hash,
            "author": current_user.full_name or current_user.email,
            "date": datetime.datetime.utcnow().isoformat() + "Z",
            "subject": req.message
        }
        mock_commits.insert(0, new_commit)
        mock_changes = []
        return {"message": "Committed changes successfully", "output": f"Commit {commit_hash[:7]} created"}

    # Staging all changes for convenience in this workspace environment
    run_git_command(["add", "."])
    output = run_git_command(["commit", "-m", req.message])
    return {"message": "Committed changes successfully", "output": output}

@router.post("/push")
def git_push(current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        return {"message": "Pushed changes to origin", "output": "Everything up-to-date"}

    output = run_git_command(["push", "origin", "main"])
    return {"message": "Pushed changes to origin", "output": output}

@router.post("/pull")
def git_pull(current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        return {"message": "Pulled changes from origin", "output": "Already up-to-date"}

    output = run_git_command(["pull"])
    return {"message": "Pulled changes from origin", "output": output}

@router.get("/log")
def git_log(limit: int = 10, current_user: User = Depends(get_current_user)):
    if not HAS_GIT:
        return {"commits": mock_commits[:limit]}

    output = run_git_command(["log", f"-n", str(limit), "--pretty=format:%H||%an||%ad||%s"])
    lines = output.strip().split("\n")
    commits = []
    for line in lines:
        if not line:
            continue
        parts = line.split("||")
        if len(parts) == 4:
            commits.append({
                "hash": parts[0],
                "author": parts[1],
                "date": parts[2],
                "subject": parts[3]
            })
    return {"commits": commits}
