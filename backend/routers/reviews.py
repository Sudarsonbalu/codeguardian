from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Header
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import io
import json
import datetime

from backend.database import get_db, SessionLocal
from backend.models.models import Review, Project, Repository, User, Issue, Report, ReviewStatus, FixHistory
from backend.schemas.review import (
    ReviewResponse, ReviewDetailResponse, PasteCodeReviewCreate,
    ReviewCreate, IssueResponse, ReportResponse, FixHistoryResponse
)
from backend.routers.auth import get_current_user
from backend.services.analysis_service import run_code_analysis

router = APIRouter(prefix="/reviews", tags=["reviews"])

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)

@router.get("/", response_model=List[ReviewResponse])
def list_reviews(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    
    query = db.query(Review).join(Project)
    if project_id:
        query = query.filter(Review.project_id == project_id)
    
    reviews = query.filter(Project.team_id.in_(user_team_ids)).order_by(Review.created_at.desc()).all()
    return reviews

@router.post("/paste", response_model=ReviewResponse)
def create_paste_review(
    review_in: PasteCodeReviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_openai_key: Optional[str] = Header(None)
):
    project = db.query(Project).filter(Project.id == review_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    if project.team_id not in user_team_ids:
        raise HTTPException(status_code=403, detail="Access denied")
        
    review = Review(
        project_id=review_in.project_id,
        title=review_in.title,
        status=ReviewStatus.PENDING,
        created_by_id=current_user.id
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Save pasted code to file
    file_path = f"uploads/paste_{review.id}.txt"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(review_in.code)
        
    background_tasks.add_task(
        run_code_analysis,
        SessionLocal,
        review.id,
        review_in.code,
        review_in.language,
        review_in.review_types,
        x_openai_key
    )
    
    return review

@router.post("/", response_model=ReviewResponse)
def create_repo_review(
    review_in: ReviewCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_openai_key: Optional[str] = Header(None)
):
    project = db.query(Project).filter(Project.id == review_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    if project.team_id not in user_team_ids:
        raise HTTPException(status_code=403, detail="Access denied")

    repo_url = ""
    repo_name = ""
    if review_in.repository_id:
        repo = db.query(Repository).filter(Repository.id == review_in.repository_id).first()
        if repo:
            repo_url = repo.url
            repo_name = repo.name

    review = Review(
        project_id=review_in.project_id,
        repository_id=review_in.repository_id,
        branch=review_in.branch or "main",
        title=review_in.title,
        status=ReviewStatus.PENDING,
        created_by_id=current_user.id
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    mock_code = f"""// CodeGuardian AI Review Demo Code for {repo_name or review_in.title}
#include <iostream>
using namespace std;

int main() {{
    string apiKey = "SG.x8238123-abc-secret-key-12345";
    cout << "Loading system with secret keys..." << endl;
    
    string query = "SELECT * FROM users WHERE username = '" + apiKey + "'";
    // execute(query);
    
    cout << "Finished process safely." << endl;
    return 0;
}}
"""
    file_path = f"uploads/repo_{review.id}.txt"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(mock_code)
        
    background_tasks.add_task(
        run_code_analysis,
        SessionLocal,
        review.id,
        mock_code,
        "javascript",
        review_in.review_types,
        x_openai_key
    )
    
    return review

@router.get("/{review_id}", response_model=ReviewDetailResponse)
def get_review_detail(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    if review.project.team_id not in user_team_ids:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return review

@router.get("/{review_id}/code")
def get_review_code(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    user_team_ids = [tm.team_id for tm in current_user.team_memberships]
    if review.project.team_id not in user_team_ids:
        raise HTTPException(status_code=403, detail="Access denied")
        
    for prefix in ["paste", "repo"]:
        file_path = f"uploads/{prefix}_{review_id}.txt"
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return {"code": f.read()}
                
    return {"code": "// Code content not found or deleted."}

@router.get("/{review_id}/report/download")
def download_report(
    review_id: int,
    format: str = "markdown",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    issues = db.query(Issue).filter(Issue.review_id == review_id).all()
    
    if format == "json":
        report_data = {
            "review_id": review.id,
            "title": review.title,
            "ai_score": review.ai_score,
            "status": review.status,
            "completed_at": str(review.completed_at),
            "issues": [
                {
                    "file": iss.file_path,
                    "line": iss.line_number,
                    "severity": iss.severity,
                    "category": iss.category,
                    "message": iss.message,
                    "suggestion": iss.suggestion,
                    "is_resolved": iss.is_resolved
                } for iss in issues
            ]
        }
        json_content = json.dumps(report_data, indent=2)
        return StreamingResponse(
            io.BytesIO(json_content.encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=codeguardian_report_{review_id}.json"}
        )
    elif format == "csv":
        csv_output = io.StringIO()
        csv_output.write("File,Line,Severity,Category,Message,Suggestion,Status\n")
        for iss in issues:
            msg = iss.message.replace('"', '""')
            sug = (iss.suggestion or "").replace('"', '""')
            status_lbl = "Resolved" if iss.is_resolved else "Active"
            csv_output.write(f'"{iss.file_path}",{iss.line_number},"{iss.severity}","{iss.category}","{msg}","{sug}","{status_lbl}"\n')
        return StreamingResponse(
            io.BytesIO(csv_output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=codeguardian_report_{review_id}.csv"}
        )
    else:
        md = f"""# CodeGuardian AI - Review Report: {review.title}
* **Overall AI Score:** {review.ai_score}/100
* **Status:** {review.status}
* **Generated On:** {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

## Summary of Code Quality Issues
Total issues detected: {len(issues)}

"""
        for idx, iss in enumerate(issues):
            status_lbl = " [RESOLVED]" if iss.is_resolved else ""
            md += f"### {idx+1}. [{iss.severity.upper()}]{status_lbl} {iss.category.title()} - Line {iss.line_number}\n"
            md += f"* **Location:** `{iss.file_path}`\n"
            md += f"* **Issue:** {iss.message}\n"
            md += f"* **Suggested Fix:**\n```\n{iss.suggestion}\n```\n\n"
            
        return StreamingResponse(
            io.BytesIO(md.encode("utf-8")),
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=codeguardian_report_{review_id}.md"}
        )

# --- AI AUTO FIX & CODE REGENERATION FEATURES ---

@router.post("/{review_id}/issues/{issue_id}/fix")
def generate_issue_fix(
    review_id: int,
    issue_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fix_type = payload.get("fix_type", "best_practice") # best_practice, performance, security, beginner, minimal
    
    # Query issue details
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.review_id == review_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    original_line = issue.line_content or ""
    
    # Generate mock code improvements based on category and fix type chosen
    fixed_code = original_line
    explanation = ""
    performance_impact = "Neutral"
    security_impact = "Neutral"
    readability_impact = "High / Positive"
    
    if issue.category == "security":
        if "api_key" in original_line or "apikey" in original_line or "secret" in original_line or "apiKey" in original_line:
            # Credentials issue
            if "string" in original_line or "string " in original_line:
                # C++ style
                fixed_code = '    string apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY"); // Loaded via Env'
            else:
                fixed_code = 'stripe.api_key = os.getenv("STRIPE_SECRET_KEY")'
            
            explanation = "Pulls the hardcoded private credential out of VCS files and dynamically reads it from env settings."
            security_impact = "Critical / Prevents credentials leak"
        else:
            # SQL injection issue
            if "string query" in original_line:
                fixed_code = '    // Use parameterized placeholders'
            else:
                fixed_code = 'cursor.execute("SELECT * FROM users WHERE username = %s", (apiKey,))'
            
            explanation = "Replaces raw string interpolation query construction with database parameter bindings to prevent script injections."
            security_impact = "Critical / Prevents SQL injection risks"
            performance_impact = "Positive / Speeds query planning"
            
    elif issue.category == "bug":
        fixed_code = "try:\n    " + original_line.strip() + "\nexcept StripeError as e:\n    logger.error(f'Payment error: {e}')"
        explanation = "Wraps external REST dependencies inside try-catch structures to avoid unhandled pipeline shutdowns."
        readability_impact = "Positive"
        
    elif issue.category == "documentation":
        fixed_code = '"""\n    Perform process capture.\n    Args:\n        amount (int): value\n    Returns:\n        bool: success\n    """\n' + original_line
        explanation = "Appends Google-style docstring explaining args, returns, and functions logic parameters."
        readability_impact = "Excellent"
        
    else:
        # Refactoring / styling
        fixed_code = original_line.replace("print(", "logger.info(")
        explanation = "Swaps stdout printing statements to enterprise level logger outputs."
        readability_impact = "High / Positive"

    # Variations based on fix mode
    if fix_type == "minimal":
        fixed_code = fixed_code.split("\n")[0] # keep it simple
        explanation += " (Minimal changes applied for minimal revision footprint)"
    elif fix_type == "performance":
        performance_impact = "High / Positive (optimized)"
    elif fix_type == "security":
        security_impact = "Critical / Fully Secured"

    return {
        "issue_id": issue_id,
        "original_code": original_line,
        "fixed_code": fixed_code,
        "explanation": explanation,
        "fix_type": fix_type,
        "impact": {
            "performance": performance_impact,
            "security": security_impact,
            "readability": readability_impact
        }
    }

@router.post("/{review_id}/issues/{issue_id}/apply")
def apply_issue_fix(
    review_id: int,
    issue_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fixed_code = payload.get("fixed_code", "")
    original_code = payload.get("original_code", "")
    fix_type = payload.get("fix_type", "best_practice")
    explanation = payload.get("explanation", "")
    
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.review_id == review_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Read review code, replace original with fixed code, and write back
    code_content = ""
    target_prefix = "paste"
    
    for prefix in ["paste", "repo"]:
        file_path = f"uploads/{prefix}_{review_id}.txt"
        if os.path.exists(file_path):
            target_prefix = prefix
            with open(file_path, "r", encoding="utf-8") as f:
                code_content = f.read()
            break
            
    if code_content:
        # Standard line replace
        if original_code in code_content:
            new_content = code_content.replace(original_code, fixed_code)
        else:
            # Fallback to replacing line content directly
            lines = code_content.split("\n")
            if 0 < issue.line_number <= len(lines):
                lines[issue.line_number - 1] = fixed_code
                new_content = "\n".join(lines)
            else:
                new_content = code_content
                
        # Write back
        file_path = f"uploads/{target_prefix}_{review_id}.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

    # Mark issue resolved
    issue.is_resolved = True
    
    # Store Fix History record
    history = FixHistory(
        review_id=review_id,
        issue_id=issue_id,
        original_code=original_code or issue.line_content or "",
        fixed_code=fixed_code,
        explanation=explanation,
        fix_type=fix_type,
        action="Applied"
    )
    db.add(history)
    
    # Recalculate score (e.g. increase by resolving issues)
    active_issues = db.query(Issue).filter(Issue.review_id == review_id, Issue.is_resolved == False).count()
    if active_issues == 0:
        review.updated_ai_score = 98.0
    else:
        current_score = review.ai_score or 80.0
        review.updated_ai_score = min(current_score + 5.0, 95.0)
        
    db.commit()
    db.refresh(review)
    db.refresh(issue)
    
    return {
        "status": "success",
        "is_resolved": issue.is_resolved,
        "updated_ai_score": review.updated_ai_score,
        "active_issues_remaining": active_issues
    }

@router.post("/{review_id}/issues/{issue_id}/test")
def generate_unit_test(
    review_id: int,
    issue_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_framework = payload.get("framework", "pytest") # pytest, JUnit, Jest
    
    issue = db.query(Issue).filter(Issue.id == issue_id, Issue.review_id == review_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    # Generate test template based on test library
    if target_framework == "pytest":
        test_code = f"""import pytest
from payments.stripe import process_charge

def test_charge_success(mocker):
    # Mock stripe.Charge.create response
    mock_charge = mocker.patch("stripe.Charge.create")
    mock_charge.return_value = {{"id": "ch_12345", "status": "succeeded"}}
    
    response = process_charge(amount=100, currency="usd")
    assert response is True
    
def test_charge_card_error(mocker):
    mock_charge = mocker.patch("stripe.Charge.create")
    from stripe.error import CardError
    mock_charge.side_effect = CardError("Card declined", param="card", code="card_declined")
    
    response = process_charge(amount=100, currency="usd")
    assert response is False
"""
    elif target_framework == "Jest":
        test_code = f"""const {{ processPayment }} = require('../payments');
const stripe = require('stripe');

jest.mock('stripe');

describe('Payment Process checks', () => {{
  test('returns true on succeeded charges', async () => {{
    stripe.Charge.create.mockResolvedValue({{ id: 'ch_123', status: 'succeeded' }});
    const result = await processPayment(100);
    expect(result).toBe(true);
  }});
}});
"""
    else:
        test_code = f"""import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class PaymentGatewayTest {{
    @Test
    public void testChargeCapture() {{
        PaymentGateway gateway = new PaymentGateway();
        boolean success = gateway.process(100);
        assertTrue(success);
    }}
}}
"""
    return {
        "framework": target_framework,
        "test_code": test_code
    }

@router.get("/{review_id}/history", response_model=List[FixHistoryResponse])
def get_fix_history(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(FixHistory).filter(FixHistory.review_id == review_id).order_by(FixHistory.created_at.desc()).all()
    return history

@router.post("/{review_id}/rollback/{history_id}")
def rollback_fix(
    review_id: int,
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(FixHistory).filter(FixHistory.id == history_id, FixHistory.review_id == review_id).first()
    if not history:
        raise HTTPException(status_code=404, detail="History record not found")
        
    issue = db.query(Issue).filter(Issue.id == history.issue_id).first()
    review = db.query(Review).filter(Review.id == review_id).first()
    
    # Restore original code inside file
    code_content = ""
    target_prefix = "paste"
    for prefix in ["paste", "repo"]:
        file_path = f"uploads/{prefix}_{review_id}.txt"
        if os.path.exists(file_path):
            target_prefix = prefix
            with open(file_path, "r", encoding="utf-8") as f:
                code_content = f.read()
            break
            
    if code_content:
        # Revert change
        new_content = code_content.replace(history.fixed_code, history.original_code)
        file_path = f"uploads/{target_prefix}_{review_id}.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
            
    # Reset is_resolved flag
    if issue:
        issue.is_resolved = False
        
    # Mark history as Rejected or rolled-back
    history.action = "Rolled Back"
    
    # Reset scores
    active_issues = db.query(Issue).filter(Issue.review_id == review_id, Issue.is_resolved == False).count()
    if active_issues == 0:
        review.updated_ai_score = 98.0
    else:
        review.updated_ai_score = review.ai_score
        
    db.commit()
    return {
        "status": "success",
        "action": "rolled_back",
        "updated_ai_score": review.updated_ai_score
    }

@router.post("/{review_id}/chat")
def chat_with_assistant(
    review_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prompt = payload.get("prompt", "")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
        
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    code = ""
    for prefix in ["paste", "repo"]:
        file_path = f"uploads/{prefix}_{review_id}.txt"
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                code = f.read()
                
    lower_prompt = prompt.lower()
    
    if "explain" in lower_prompt:
        response = f"This code implements logic for {review.title}. It includes basic validations. However, it displays security issues such as inline credentials and vulnerability to SQL injections."
    elif "optimize" in lower_prompt or "performance" in lower_prompt:
        response = "To optimize performance, avoid re-declaring internal sub-routines inside rendering loops or hot paths. Cache computed values using memoization or localized constants."
    elif "test" in lower_prompt or "unit test" in lower_prompt:
        response = f"Here is a sample unit test structure for this code:\n\n```python\nimport unittest\n\nclass TestCodeReviewReview(unittest.TestCase):\n    def test_run_success(self):\n        # Verify core execution pathways\n        self.assertTrue(True)\n\nif __name__ == '__main__':\n    unittest.main()\n```"
    elif "fix" in lower_prompt:
        response = "The recommended fix is to parameterize database execution inputs and pull hardcoded secrets into secure environment variables."
    else:
        response = f"I've analyzed your request: '{prompt}'. This codebase has an AI Score of {review.ai_score or 'N/A'}/100. I recommend looking at line-level security findings."
        
    return {"response": response}

@router.post("/{review_id}/fix-all")
def fix_all_issues(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    issues = db.query(Issue).filter(Issue.review_id == review_id, Issue.is_resolved == False).all()
    if not issues:
        return {"status": "success", "message": "No unresolved issues found.", "updated_ai_score": review.updated_ai_score or review.ai_score}

    # Load active file content
    code_content = ""
    target_prefix = "paste"
    for prefix in ["paste", "repo"]:
        file_path = f"uploads/{prefix}_{review_id}.txt"
        if os.path.exists(file_path):
            target_prefix = prefix
            with open(file_path, "r", encoding="utf-8") as f:
                code_content = f.read()
            break
            
    if not code_content:
        raise HTTPException(status_code=400, detail="Repository file not found.")

    applied_fixes = 0
    new_content = code_content

    for issue in issues:
        original_line = issue.line_content or ""
        fixed_code = original_line
        explanation = ""
        
        if issue.category == "security":
            if "api_key" in original_line or "apikey" in original_line or "secret" in original_line or "apiKey" in original_line:
                if "string" in original_line or "string " in original_line:
                    fixed_code = '    string apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY"); // Loaded via Env'
                else:
                    fixed_code = 'stripe.api_key = os.getenv("STRIPE_SECRET_KEY")'
                explanation = "Pulls the hardcoded private credential out of VCS files and dynamically reads it from env settings."
            else:
                if "string query" in original_line:
                    fixed_code = '    // Use parameterized placeholders'
                else:
                    fixed_code = 'cursor.execute("SELECT * FROM users WHERE username = %s", (apiKey,))'
                explanation = "Replaces raw string interpolation query construction with database parameter bindings to prevent script injections."
        elif issue.category == "bug":
            fixed_code = "try:\n    " + original_line.strip() + "\nexcept StripeError as e:\n    logger.error(f\'Payment error: {e}\')"
            explanation = "Wraps external REST dependencies inside try-catch structures to avoid unhandled pipeline shutdowns."
        elif issue.category == "documentation":
            fixed_code = '"""\n    Perform process capture.\n    Args:\n        amount (int): value\n    Returns:\n        bool: success\n    """\n' + original_line
            explanation = "Appends Google-style docstring explaining args, returns, and functions logic parameters."
        else:
            fixed_code = original_line.replace("print(", "logger.info(")
            explanation = "Swaps stdout printing statements to enterprise level logger outputs."

        # Replace in code content
        if original_line and original_line in new_content:
            new_content = new_content.replace(original_line, fixed_code)
            applied_fixes += 1
            issue.is_resolved = True
            
            # Store Fix History record
            history = FixHistory(
                review_id=review_id,
                issue_id=issue.id,
                original_code=original_line,
                fixed_code=fixed_code,
                explanation=explanation,
                fix_type="best_practice",
                action="Applied"
            )
            db.add(history)

    if applied_fixes > 0:
        file_path = f"uploads/{target_prefix}_{review_id}.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

    review.updated_ai_score = 98.0
    db.commit()
    db.refresh(review)

    return {
        "status": "success",
        "message": f"Successfully fixed {applied_fixes} issues.",
        "updated_ai_score": review.updated_ai_score,
        "resolved_count": applied_fixes
    }

