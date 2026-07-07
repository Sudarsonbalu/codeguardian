import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.database import Base
import enum

class MemberRole(str, enum.Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"
    DEVELOPER = "developer"
    VIEWER = "viewer"

class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    PARSING = "parsing"
    STATIC_ANALYSIS = "static_analysis"
    AI_REASONING = "ai_reasoning"
    COMPLETED = "completed"
    FAILED = "failed"

class IssueSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class IssueCategory(str, enum.Enum):
    SECURITY = "security"
    BUG = "bug"
    PERFORMANCE = "performance"
    DOCUMENTATION = "documentation"
    REFACTORING = "refactoring"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    provider = Column(String, nullable=True)
    github_token = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    reviews_created = relationship("Review", back_populates="created_by", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="team", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(MemberRole), default=MemberRole.DEVELOPER, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    team = relationship("Team", back_populates="projects")
    repositories = relationship("Repository", back_populates="project", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="project", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    provider = Column(String, default="github")
    default_branch = Column(String, default="main")
    github_id = Column(Integer, nullable=True)
    github_full_name = Column(String, nullable=True)
    is_cloned = Column(Boolean, default=False)
    local_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    project = relationship("Project", back_populates="repositories")
    reviews = relationship("Review", back_populates="repository", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    branch = Column(String, nullable=True)
    commit_hash = Column(String, nullable=True)
    pull_request_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    status = Column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False)
    ai_score = Column(Float, nullable=True)
    updated_ai_score = Column(Float, nullable=True)
    agent_summary = Column(Text, nullable=True)          # JSON blob of per-agent summaries
    architecture_diagram = Column(Text, nullable=True)  # Mermaid diagram string
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    project = relationship("Project", back_populates="reviews")
    repository = relationship("Repository", back_populates="reviews")
    created_by = relationship("User", back_populates="reviews_created")
    issues = relationship("Issue", back_populates="review", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="review", cascade="all, delete-orphan")
    fix_histories = relationship("FixHistory", back_populates="review", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="review", cascade="all, delete-orphan")

class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False)
    line_number = Column(Integer, nullable=False)
    severity = Column(SQLEnum(IssueSeverity), nullable=False)
    category = Column(SQLEnum(IssueCategory), nullable=False)
    message = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=True)
    line_content = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False, nullable=False)
    agent_name = Column(String, nullable=True)           # Which agent found it
    confidence_score = Column(Float, nullable=True)      # 0.0 - 1.0
    impact_analysis = Column(Text, nullable=True)        # Impact description
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    review = relationship("Review", back_populates="issues")

class FixHistory(Base):
    __tablename__ = "fix_histories"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    original_code = Column(Text, nullable=False)
    fixed_code = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    fix_type = Column(String, nullable=False)
    action = Column(String, default="Applied")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    review = relationship("Review", back_populates="fix_histories")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    format = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    review = relationship("Review", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    team = relationship("Team", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    type = Column(String, default="info")
    review_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", back_populates="notifications")

# ---- Phase 2 New Models ----

class AgentRun(Base):
    """Logs each agent execution for analytics and auditing."""
    __tablename__ = "agent_runs"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String, nullable=False)
    issue_count = Column(Integer, default=0)
    score_contribution = Column(Float, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    review = relationship("Review", back_populates="agent_runs")

class GitHubRepo(Base):
    """Cached GitHub repository metadata for the repo browser."""
    __tablename__ = "github_repos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    github_id = Column(Integer, nullable=False)
    full_name = Column(String, nullable=False)       # owner/repo
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    html_url = Column(String, nullable=False)
    default_branch = Column(String, default="main")
    language = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    is_private = Column(Boolean, default=False)
    updated_at_gh = Column(DateTime, nullable=True)  # GitHub's updated_at
    cached_at = Column(DateTime, default=datetime.datetime.utcnow)

class CommitRecord(Base):
    """Cached commit history for repository browser."""
    __tablename__ = "commit_records"
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    sha = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    author_name = Column(String, nullable=True)
    author_email = Column(String, nullable=True)
    committed_at = Column(DateTime, nullable=True)
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DocGeneration(Base):
    """Stores AI-generated documentation artifacts."""
    __tablename__ = "doc_generations"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String, nullable=False)  # readme, api_docs, function_docs, architecture
    content = Column(Text, nullable=False)
    language = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
