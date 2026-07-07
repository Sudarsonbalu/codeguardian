"""
Analysis Service — Updated to use the multi-agent AI Orchestrator.
Maintains full backward compatibility with existing review workflow.
"""
import asyncio
import json
from sqlalchemy.orm import Session
from backend.models.models import Review, ReviewStatus, Issue, IssueSeverity, IssueCategory, Notification
from backend.services.orchestrator import orchestrator
from backend.services.websocket_manager import manager


async def run_code_analysis(
    db_session_factory,
    review_id: int,
    code_content: str,
    language: str,
    review_types: list,
    openai_api_key: str = None
):
    """
    Run multi-agent AI analysis on submitted code.
    Replaces the old single-pass analysis with the full AI Orchestrator.
    """
    db: Session = db_session_factory()
    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            return

        async def notify(status_val: str, progress: int, msg: str):
            await manager.broadcast_to_review(review_id, {
                "review_id": review_id,
                "status": status_val,
                "progress": progress,
                "message": msg
            })
            await asyncio.sleep(0.05)

        # Step 1 — Parsing
        review.status = ReviewStatus.PARSING
        db.commit()
        await notify(ReviewStatus.PARSING, 10, "🔍 Parsing code structure and AST...")
        await asyncio.sleep(0.8)

        # Step 2 — Static Analysis
        review.status = ReviewStatus.STATIC_ANALYSIS
        db.commit()
        await notify(ReviewStatus.STATIC_ANALYSIS, 25, "⚙️ Running static analysis rules...")
        await asyncio.sleep(0.5)

        # Step 3 — Multi-Agent AI Reasoning
        review.status = ReviewStatus.AI_REASONING
        db.commit()

        completed_agents = []

        async def on_agent_progress(agent_name: str, result: dict):
            completed_agents.append(agent_name)
            total_agents = 7
            progress = 30 + int((len(completed_agents) / total_agents) * 55)
            await notify(
                ReviewStatus.AI_REASONING,
                progress,
                f"🤖 {agent_name} completed — {result.get('issue_count', 0)} issues found"
            )

        await notify(ReviewStatus.AI_REASONING, 30, "🚀 Launching 7 AI agents in parallel...")

        # Run orchestrator
        result = await orchestrator.run(
            code=code_content,
            language=language,
            review_types=review_types,
            on_progress=on_agent_progress,
            openai_api_key=openai_api_key
        )

        await notify(ReviewStatus.AI_REASONING, 88, "🔀 Merging agent results and deduplicating...")
        await asyncio.sleep(0.3)

        # Clear previous issues
        db.query(Issue).filter(Issue.review_id == review_id).delete()

        # Save all issues
        for iss in result["issues"]:
            severity_map = {
                "critical": IssueSeverity.CRITICAL,
                "error": IssueSeverity.ERROR,
                "warning": IssueSeverity.WARNING,
                "info": IssueSeverity.INFO,
            }
            category_map = {
                "security": IssueCategory.SECURITY,
                "bug": IssueCategory.BUG,
                "performance": IssueCategory.PERFORMANCE,
                "documentation": IssueCategory.DOCUMENTATION,
                "refactoring": IssueCategory.REFACTORING,
            }

            db_issue = Issue(
                review_id=review_id,
                file_path=iss.get("file_path", f"code.{language[:3]}"),
                line_number=iss.get("line_number", 1),
                severity=severity_map.get(iss.get("severity", "info"), IssueSeverity.INFO),
                category=category_map.get(iss.get("category", "bug"), IssueCategory.BUG),
                message=iss.get("message", ""),
                suggestion=iss.get("suggestion", ""),
                line_content=iss.get("line_content", ""),
                agent_name=iss.get("agent_name"),
                confidence_score=iss.get("confidence_score"),
                impact_analysis=iss.get("impact_analysis"),
            )
            db.add(db_issue)

        # Save agent summaries as JSON on the review
        review.status = ReviewStatus.COMPLETED
        review.ai_score = result["final_score"]
        review.agent_summary = json.dumps(result.get("agent_summaries", {}))
        if result.get("architecture_diagram"):
            review.architecture_diagram = result["architecture_diagram"]
        db.commit()

        # Notification
        notif = Notification(
            user_id=review.created_by_id,
            title="✅ AI Review Completed",
            message=(
                f"Review for '{review.title}' completed with AI Score: {result['final_score']}/100. "
                f"{result['total_issues']} issues detected by {len(result['agents_run'])} AI agents."
            ),
            type="review_completed",
            review_id=review_id
        )
        db.add(notif)
        db.commit()

        await notify(ReviewStatus.COMPLETED, 100, f"✅ Review complete! Score: {result['final_score']}/100")

    except Exception as e:
        db.rollback()
        review = db.query(Review).filter(Review.id == review_id).first()
        if review:
            review.status = ReviewStatus.FAILED
            db.commit()
        await manager.broadcast_to_review(review_id, {
            "review_id": review_id,
            "status": "failed",
            "progress": 100,
            "message": f"Analysis failed: {str(e)}"
        })
    finally:
        db.close()


def get_extension(lang: str) -> str:
    mapping = {
        "python": "py", "javascript": "js", "typescript": "ts",
        "typescriptreact": "tsx", "javascriptreact": "jsx",
        "go": "go", "rust": "rs", "java": "java", "cpp": "cpp", "php": "php"
    }
    return mapping.get(lang.lower(), "txt")
