from pydantic import BaseModel
from typing import List, Dict, Any

class ReviewTrendItem(BaseModel):
    label: str  # e.g., "Mon", "Tue" or "Week 1"
    reviews: int
    score: float

class LanguageAnalyticsItem(BaseModel):
    language: str
    percentage: float
    count: int
    color: str

class SecurityTrendItem(BaseModel):
    label: str
    critical: int
    high: int
    medium: int
    low: int

class DashboardStats(BaseModel):
    total_reviews: int
    total_reviews_change: float  # Percentage increase
    ai_score: float
    ai_score_change: float
    security_issues: int
    security_issues_change: float
    bugs_found: int
    bugs_found_change: float
    performance_issues: int
    performance_issues_change: float
    active_projects: int
    security_score: float = 94.2
    maintainability_index: float = 85.5
    technical_debt_hours: float = 36.5
    cyclomatic_complexity: int = 12
    halstead_difficulty: float = 16.4
    coverage_percentage: float = 78.4
    bug_density: float = 0.8
    ai_confidence: float = 93.5

class AnalyticsDashboard(BaseModel):
    stats: DashboardStats
    trends: List[ReviewTrendItem]
    languages: List[LanguageAnalyticsItem]
    security_trends: List[SecurityTrendItem]
