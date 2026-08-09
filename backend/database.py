import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

db_url = settings.DATABASE_URL

if not db_url or not db_url.strip():
    tmp_db = os.path.join(tempfile.gettempdir(), "codeguardian.db")
    db_url = f"sqlite:///{tmp_db}"

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
elif db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        connect_args=connect_args
    )
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Database connection note ({e}). Falling back to temporary SQLite database.")
    tmp_db = os.path.join(tempfile.gettempdir(), "codeguardian.db")
    db_url = f"sqlite:///{tmp_db}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        connect_args=connect_args
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
