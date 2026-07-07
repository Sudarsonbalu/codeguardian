from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from backend.models.models import ReviewStatus, IssueSeverity, IssueCategory

class IssueBase(BaseModel):
    file_path: str
    line_number: int
    severity: IssueSeverity
    category: IssueCategory
    message: str
    suggestion: Optional[str] = None
    line_content: Optional[str] = None

class IssueCreate(IssueBase):
    pass

class IssueResponse(IssueBase):
    id: int
    review_id: int
    is_resolved: bool
    agent_name: Optional[str] = None
    confidence_score: Optional[float] = None
    impact_analysis: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    format: str
    file_url: str

class ReportResponse(ReportBase):
    id: int
    review_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewBase(BaseModel):
    title: str
    branch: Optional[str] = None
    commit_hash: Optional[str] = None
    pull_request_id: Optional[str] = None

class ReviewCreate(ReviewBase):
    project_id: int
    repository_id: Optional[int] = None
    review_types: List[str] = ["bug", "security", "performance", "documentation"]

class ReviewResponse(ReviewBase):
    id: int
    project_id: int
    repository_id: Optional[int] = None
    status: ReviewStatus
    ai_score: Optional[float] = None
    updated_ai_score: Optional[float] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FixHistoryResponse(BaseModel):
    id: int
    review_id: int
    issue_id: Optional[int] = None
    original_code: str
    fixed_code: str
    explanation: Optional[str] = None
    fix_type: str
    action: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewDetailResponse(ReviewResponse):
    issues: List[IssueResponse] = []
    reports: List[ReportResponse] = []
    fix_histories: List[FixHistoryResponse] = []
    agent_summary: Optional[str] = None
    architecture_diagram: Optional[str] = None

    class Config:
        from_attributes = True

class PasteCodeReviewCreate(BaseModel):
    title: str
    code: str
    language: str
    project_id: int
    review_types: List[str] = ["bug", "security", "performance", "documentation", "clean_code", "testing", "architecture"]
