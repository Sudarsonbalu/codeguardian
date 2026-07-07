from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

# For sqlite testing or dev fallback if needed, we can handle it.
# Usually, production is PostgreSQL.
db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        connect_args=connect_args
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Database connection failed ({e}). Falling back to local SQLite database.")
    db_url = "sqlite:///codeguardian.db"
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
