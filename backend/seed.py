from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.models import User, Team, TeamMember, Project, Repository, MemberRole
from backend.services import auth_service
import datetime

def seed_database():
    db = SessionLocal()
    try:
        # Check if demo user already exists
        demo_email = "demo@codeguardian.ai"
        user = db.query(User).filter(User.email == demo_email).first()
        if user:
            print("Database already seeded with demo user.")
            return

        print("Seeding demo database values...")

        # Create demo user
        hashed_password = auth_service.get_password_hash("demo1234")
        db_user = User(
            email=demo_email,
            hashed_password=hashed_password,
            full_name="Demo User",
            avatar_url=f"https://api.dicebear.com/7.x/adventurer/svg?seed={demo_email}",
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create demo team
        default_team = Team(name="Demo Team Workspace")
        db.add(default_team)
        db.commit()
        db.refresh(default_team)

        # Add user to team
        team_member = TeamMember(
            team_id=default_team.id,
            user_id=db_user.id,
            role=MemberRole.ADMIN
        )
        db.add(team_member)
        db.commit()

        # Create demo project
        project = Project(
            name="CodeGuardian Core",
            description="The core analysis gateway and dashboard for enterprise security.",
            team_id=default_team.id
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # Create demo repository
        repo = Repository(
            project_id=project.id,
            name="codeguardian-gateway",
            url="https://github.com/codeguardian/codeguardian-gateway",
            provider="github",
            default_branch="main"
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)

        print("Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

