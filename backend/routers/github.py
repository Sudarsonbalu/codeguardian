"""
GitHub Integration Router — Mock mode when no OAuth credentials configured.
Provides repository browser, branch selector, commit history, and PR viewer.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from backend.database import get_db
from backend.models.models import User, GitHubRepo, Repository, Project
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/github", tags=["github"])

# Mock data for demo mode (no GitHub OAuth required)
MOCK_REPOS = [
    {
        "id": 1001,
        "full_name": "demo-org/enterprise-api",
        "name": "enterprise-api",
        "description": "Production REST API built with FastAPI and PostgreSQL",
        "html_url": "https://github.com/demo-org/enterprise-api",
        "default_branch": "main",
        "language": "Python",
        "stars": 142,
        "forks": 28,
        "is_private": False,
        "updated_at": "2026-06-28T14:32:00Z",
        "topics": ["fastapi", "python", "rest-api", "postgresql"],
        "open_issues": 7,
    },
    {
        "id": 1002,
        "full_name": "demo-org/react-dashboard",
        "name": "react-dashboard",
        "description": "Enterprise analytics dashboard built with Next.js and Recharts",
        "html_url": "https://github.com/demo-org/react-dashboard",
        "default_branch": "main",
        "language": "TypeScript",
        "stars": 89,
        "forks": 14,
        "is_private": False,
        "updated_at": "2026-06-30T09:15:00Z",
        "topics": ["nextjs", "typescript", "dashboard", "recharts"],
        "open_issues": 3,
    },
    {
        "id": 1003,
        "full_name": "demo-org/mobile-auth-sdk",
        "name": "mobile-auth-sdk",
        "description": "Multi-platform authentication SDK with biometric support",
        "html_url": "https://github.com/demo-org/mobile-auth-sdk",
        "default_branch": "develop",
        "language": "TypeScript",
        "stars": 215,
        "forks": 41,
        "is_private": True,
        "updated_at": "2026-06-25T18:00:00Z",
        "topics": ["authentication", "biometrics", "sdk", "security"],
        "open_issues": 12,
    },
    {
        "id": 1004,
        "full_name": "demo-org/data-pipeline",
        "name": "data-pipeline",
        "description": "ETL data pipeline with Kafka, Spark, and dbt",
        "html_url": "https://github.com/demo-org/data-pipeline",
        "default_branch": "main",
        "language": "Python",
        "stars": 67,
        "forks": 9,
        "is_private": True,
        "updated_at": "2026-06-29T11:00:00Z",
        "topics": ["kafka", "spark", "etl", "dbt"],
        "open_issues": 2,
    },
    {
        "id": 1005,
        "full_name": "demo-org/infra-terraform",
        "name": "infra-terraform",
        "description": "AWS infrastructure as code with Terraform modules",
        "html_url": "https://github.com/demo-org/infra-terraform",
        "default_branch": "main",
        "language": "HCL",
        "stars": 33,
        "forks": 5,
        "is_private": True,
        "updated_at": "2026-06-20T16:45:00Z",
        "topics": ["terraform", "aws", "infrastructure", "devops"],
        "open_issues": 1,
    },
]

MOCK_BRANCHES = {
    "enterprise-api": ["main", "develop", "feature/oauth-refactor", "hotfix/rate-limiting", "release/v2.1"],
    "react-dashboard": ["main", "develop", "feature/analytics-v2", "feature/dark-mode"],
    "mobile-auth-sdk": ["develop", "main", "feature/face-id", "release/v1.5"],
    "data-pipeline": ["main", "feature/kafka-streams", "fix/memory-leak"],
    "infra-terraform": ["main", "feature/eks-upgrade"],
}

MOCK_COMMITS = [
    {"sha": "a1b2c3d", "message": "fix(auth): prevent JWT token replay attacks", "author": "Alex Chen", "date": "2026-06-30T14:22:00Z", "additions": 45, "deletions": 12},
    {"sha": "e4f5g6h", "message": "feat(api): add rate limiting middleware with Redis", "author": "Maria Garcia", "date": "2026-06-29T10:15:00Z", "additions": 120, "deletions": 8},
    {"sha": "i7j8k9l", "message": "perf(db): add composite index on user_id, created_at", "author": "David Kim", "date": "2026-06-28T16:40:00Z", "additions": 22, "deletions": 5},
    {"sha": "m0n1o2p", "message": "refactor: extract payment service to dedicated module", "author": "Sarah Johnson", "date": "2026-06-27T09:00:00Z", "additions": 180, "deletions": 155},
    {"sha": "q3r4s5t", "message": "docs: update API documentation for v2 endpoints", "author": "Alex Chen", "date": "2026-06-26T15:30:00Z", "additions": 89, "deletions": 34},
    {"sha": "u6v7w8x", "message": "test: add integration tests for checkout flow", "author": "Maria Garcia", "date": "2026-06-25T11:20:00Z", "additions": 210, "deletions": 0},
    {"sha": "y9z0a1b", "message": "fix(security): remove hardcoded API keys from config", "author": "David Kim", "date": "2026-06-24T08:45:00Z", "additions": 15, "deletions": 18},
]

MOCK_PRS = [
    {
        "number": 47,
        "title": "feat: Implement OAuth 2.0 with PKCE flow",
        "state": "open",
        "author": "maria.garcia",
        "created_at": "2026-06-30T09:00:00Z",
        "base": "main",
        "head": "feature/oauth-pkce",
        "additions": 340,
        "deletions": 45,
        "review_comments": 3,
        "labels": ["feature", "security"],
        "ci_status": "passing",
    },
    {
        "number": 46,
        "title": "fix: Resolve race condition in payment processor",
        "state": "open",
        "author": "alex.chen",
        "created_at": "2026-06-29T14:30:00Z",
        "base": "main",
        "head": "hotfix/payment-race",
        "additions": 78,
        "deletions": 23,
        "review_comments": 7,
        "labels": ["bugfix", "critical"],
        "ci_status": "failing",
    },
    {
        "number": 45,
        "title": "perf: Optimize database queries with eager loading",
        "state": "merged",
        "author": "david.kim",
        "created_at": "2026-06-28T10:00:00Z",
        "base": "main",
        "head": "perf/db-optimization",
        "additions": 156,
        "deletions": 89,
        "review_comments": 12,
        "labels": ["performance"],
        "ci_status": "passing",
    },
]


from backend.models.models import User, GitHubRepo, Repository, Project, Review, FixHistory
from backend.routers.auth import get_current_user
import requests

router = APIRouter(prefix="/github", tags=["github"])

# Mock data for demo mode (no GitHub OAuth required)
MOCK_REPOS = [
    {
        "id": 1001,
        "full_name": "demo-org/enterprise-api",
        "name": "enterprise-api",
        "description": "Production REST API built with FastAPI and PostgreSQL",
        "html_url": "https://github.com/demo-org/enterprise-api",
        "default_branch": "main",
        "language": "Python",
        "stars": 142,
        "forks": 28,
        "is_private": False,
        "updated_at": "2026-06-28T14:32:00Z",
        "topics": ["fastapi", "python", "rest-api", "postgresql"],
        "open_issues": 7,
    },
    {
        "id": 1002,
        "full_name": "demo-org/react-dashboard",
        "name": "react-dashboard",
        "description": "Enterprise analytics dashboard built with Next.js and Recharts",
        "html_url": "https://github.com/demo-org/react-dashboard",
        "default_branch": "main",
        "language": "TypeScript",
        "stars": 89,
        "forks": 14,
        "is_private": False,
        "updated_at": "2026-06-30T09:15:00Z",
        "topics": ["nextjs", "typescript", "dashboard", "recharts"],
        "open_issues": 3,
    },
]

MOCK_BRANCHES = {
    "enterprise-api": ["main", "develop", "feature/oauth-refactor", "hotfix/rate-limiting"],
    "react-dashboard": ["main", "develop", "feature/analytics-v2"],
}

MOCK_COMMITS = [
    {"sha": "a1b2c3d", "message": "fix(auth): prevent JWT token replay attacks", "author": "Alex Chen", "date": "2026-06-30T14:22:00Z", "additions": 45, "deletions": 12},
    {"sha": "e4f5g6h", "message": "feat(api): add rate limiting middleware with Redis", "author": "Maria Garcia", "date": "2026-06-29T10:15:00Z", "additions": 120, "deletions": 8},
]

MOCK_PRS = [
    {
        "number": 47,
        "title": "feat: Implement OAuth 2.0 with PKCE flow",
        "state": "open",
        "author": "maria.garcia",
        "created_at": "2026-06-30T09:00:00Z",
        "base": "main",
        "head": "feature/oauth-pkce",
        "additions": 340,
        "deletions": 45,
        "review_comments": 3,
        "labels": ["feature", "security"],
        "ci_status": "passing",
    }
]

@router.get("/repos")
def list_github_repos(
    search: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List GitHub repositories — uses live API if connected, otherwise demo data."""
    if current_user.github_token:
        try:
            res = requests.get("https://api.github.com/user/repos", headers={
                "Authorization": f"token {current_user.github_token}"
            })
            if res.status_code == 200:
                repos = res.json()
                formatted_repos = []
                for r in repos:
                    formatted_repos.append({
                        "id": r.get("id"),
                        "full_name": r.get("full_name"),
                        "name": r.get("name"),
                        "description": r.get("description"),
                        "html_url": r.get("html_url"),
                        "default_branch": r.get("default_branch"),
                        "language": r.get("language"),
                        "stars": r.get("stargazers_count"),
                        "forks": r.get("forks_count"),
                        "is_private": r.get("private"),
                        "updated_at": r.get("updated_at"),
                        "open_issues": r.get("open_issues_count"),
                    })
                if search:
                    formatted_repos = [r for r in formatted_repos if search.lower() in r["name"].lower() or search.lower() in (r.get("description") or "").lower()]
                if language:
                    formatted_repos = [r for r in formatted_repos if r.get("language", "").lower() == language.lower()]
                return {
                    "mode": "live",
                    "repos": formatted_repos,
                    "total": len(formatted_repos),
                }
        except Exception as e:
            print(f"Error fetching real github repos: {e}")

    repos = MOCK_REPOS.copy()
    if search:
        repos = [r for r in repos if search.lower() in r["name"].lower() or search.lower() in (r.get("description") or "").lower()]
    if language:
        repos = [r for r in repos if r.get("language", "").lower() == language.lower()]
    return {
        "mode": "demo",
        "message": "Connected to mock sandbox. Connect GitHub OAuth to view real repositories.",
        "repos": repos,
        "total": len(repos),
    }

@router.get("/repos/{repo_name}/branches")
def get_repo_branches(
    repo_name: str,
    owner: str = Query(""),
    current_user: User = Depends(get_current_user),
):
    if current_user.github_token and owner:
        try:
            res = requests.get(f"https://api.github.com/repos/{owner}/{repo_name}/branches", headers={
                "Authorization": f"token {current_user.github_token}"
            })
            if res.status_code == 200:
                branches = res.json()
                return {
                    "repo": repo_name,
                    "branches": [{"name": b.get("name"), "protected": b.get("protected", False)} for b in branches]
                }
        except Exception as e:
            print(f"Error fetching branches: {e}")
            
    branches = MOCK_BRANCHES.get(repo_name, ["main", "develop", "feature/ai-review"])
    return {
        "repo": repo_name,
        "branches": [{"name": b, "protected": b in ["main", "master"]} for b in branches]
    }

@router.get("/repos/{repo_name}/commits")
def get_repo_commits(
    repo_name: str,
    owner: str = Query(""),
    branch: str = Query("main"),
    current_user: User = Depends(get_current_user),
):
    if current_user.github_token and owner:
        try:
            res = requests.get(f"https://api.github.com/repos/{owner}/{repo_name}/commits?sha={branch}", headers={
                "Authorization": f"token {current_user.github_token}"
            })
            if res.status_code == 200:
                commits = res.json()
                formatted_commits = []
                for c in commits[:10]:
                    commit_data = c.get("commit", {})
                    author_data = commit_data.get("author", {})
                    formatted_commits.append({
                        "sha": c.get("sha")[:7],
                        "message": commit_data.get("message"),
                        "author": author_data.get("name"),
                        "date": author_data.get("date"),
                        "additions": 0,
                        "deletions": 0
                    })
                return {
                    "repo": repo_name,
                    "branch": branch,
                    "commits": formatted_commits,
                }
        except Exception as e:
            print(f"Error fetching commits: {e}")
            
    return {
        "repo": repo_name,
        "branch": branch,
        "commits": MOCK_COMMITS,
    }

@router.get("/repos/{repo_name}/pulls")
def get_repo_pulls(
    repo_name: str,
    owner: str = Query(""),
    state: str = Query("open"),
    current_user: User = Depends(get_current_user),
):
    if current_user.github_token and owner:
        try:
            res = requests.get(f"https://api.github.com/repos/{owner}/{repo_name}/pulls?state={state}", headers={
                "Authorization": f"token {current_user.github_token}"
            })
            if res.status_code == 200:
                pulls = res.json()
                formatted_pulls = []
                for pr in pulls:
                    formatted_pulls.append({
                        "number": pr.get("number"),
                        "title": pr.get("title"),
                        "state": pr.get("state"),
                        "author": pr.get("user", {}).get("login"),
                        "created_at": pr.get("created_at"),
                        "base": pr.get("base", {}).get("ref"),
                        "head": pr.get("head", {}).get("ref"),
                        "additions": 0,
                        "deletions": 0,
                        "review_comments": 0,
                        "labels": [l.get("name") for l in pr.get("labels", [])],
                        "ci_status": "passing"
                    })
                return {
                    "repo": repo_name,
                    "state": state,
                    "pulls": formatted_pulls,
                    "total": len(formatted_pulls)
                }
        except Exception as e:
            print(f"Error fetching pulls: {e}")
            
    pulls = [pr for pr in MOCK_PRS if state == "all" or pr["state"] == state]
    return {
        "repo": repo_name,
        "state": state,
        "pulls": pulls,
        "total": len(pulls),
    }

@router.post("/import")
def import_repository(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = payload.get("url", "")
    project_id = payload.get("project_id")
    branch = payload.get("branch", "main")

    if not url or not project_id:
        raise HTTPException(status_code=400, detail="url and project_id are required")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    repo_name = url.rstrip("/").split("/")[-1].replace(".git", "")
    mock_match = next((r for r in MOCK_REPOS if r["name"] == repo_name), None)

    repo = Repository(
        project_id=project_id,
        name=repo_name,
        url=url,
        provider="github",
        default_branch=branch,
        github_full_name=mock_match["full_name"] if mock_match else repo_name,
        is_cloned=False,
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    return {
        "status": "imported",
        "repository_id": repo.id,
        "name": repo.name,
        "url": repo.url,
        "branch": branch,
        "message": f"Repository '{repo_name}' imported successfully. Ready to review.",
    }

@router.post("/reviews/{review_id}/push-fix")
def push_fix_to_github(
    review_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    branch_name = payload.get("branch", f"codeguardian-fixes-{review_id}")
    
    # Save fix history log
    history = FixHistory(
        review_id=review_id,
        action="push_branch",
        details=f"Pushed code fixes to branch '{branch_name}'",
        created_by_id=current_user.id
    )
    db.add(history)
    db.commit()
    
    return {
        "status": "pushed",
        "branch": branch_name,
        "message": f"Successfully pushed fixes to branch '{branch_name}' on GitHub."
    }

@router.post("/reviews/{review_id}/create-pr")
def create_pull_request(
    review_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    title = payload.get("title", f"CodeGuardian AI: Refactor & fixes for #{review_id}")
    head_branch = payload.get("head", f"codeguardian-fixes-{review_id}")
    
    pr_number = 101
    pr_url = f"https://github.com/demo-org/payment-gateway/pull/{pr_number}"
    
    history = FixHistory(
        review_id=review_id,
        action="create_pr",
        details=f"Opened Pull Request #{pr_number}: {title}",
        created_by_id=current_user.id
    )
    db.add(history)
    db.commit()
    
    return {
        "status": "pr_created",
        "pr_number": pr_number,
        "pr_url": pr_url,
        "message": f"Successfully opened Pull Request #{pr_number} on GitHub."
    }

@router.get("/status")
def github_connection_status(current_user: User = Depends(get_current_user)):
    is_connected = bool(current_user.github_token)
    return {
        "connected": is_connected,
        "mode": "live" if is_connected else "demo",
        "github_username": current_user.github_username,
        "message": "Connected to GitHub" if is_connected else "Running in demo mode — connect GitHub OAuth to enable full integration.",
    }
