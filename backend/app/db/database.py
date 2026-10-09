import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    # Ensure directory exists if SQLite file is located in a nested folder or persistent volume mount
    db_file_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_file_path and not db_file_path.startswith(":memory:"):
        db_dir = os.path.dirname(os.path.abspath(db_file_path))
        if db_dir and not os.path.exists(db_dir):
            try:
                os.makedirs(db_dir, exist_ok=True)
            except Exception as e:
                print(f"[LandDelay AI] Warning: Could not create SQLite directory {db_dir}: {e}")
else:
    # PostgreSQL connection pool settings for Render / production databases
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
