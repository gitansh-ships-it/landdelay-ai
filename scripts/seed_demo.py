import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.database import SessionLocal, Base, engine
from app.services.demo_service import reset_and_reseed_database

def main():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Executing deterministic seed generator (seed=42)...")
        count = reset_and_reseed_database(db)
        print(f"Successfully generated and seeded {count} synthetic acquisition cases.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
