import secrets
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db
from app.services.demo_service import generate_synthetic_dataset, reset_and_reseed_database
from app.models.case import AcquisitionCase

router = APIRouter(prefix="/demo", tags=["Demonstration & Simulation"])

def verify_admin_authorization(x_admin_key: str = Header(None, alias="X-Admin-Key")):
    """
    Enforces security safeguard: prevents anonymous or unauthorized callers
    from executing destructive database resets or re-seed operations.
    Uses timing-safe comparison.
    """
    configured_key = settings.ADMIN_RESET_KEY.strip() if settings.ADMIN_RESET_KEY else ""

    if not configured_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative operations are disabled: ADMIN_RESET_KEY is not configured on the server."
        )

    if not x_admin_key or not secrets.compare_digest(x_admin_key, configured_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid administrative key required in 'X-Admin-Key' header to execute database reset."
        )
    return True

@router.post("/seed")
def seed_demo_data(
    authorized: bool = Depends(verify_admin_authorization),
    db: Session = Depends(get_db)
):
    count = db.query(AcquisitionCase).count()
    if count >= 200:
        return {
            "status": "ALREADY_SEEDED",
            "message": f"Database already contains {count} cases. Use /api/demo/reset if you wish to re-seed from scratch.",
            "count": count
        }
    
    seeded_count = generate_synthetic_dataset(db, count=250)
    return {
        "status": "SUCCESS",
        "message": f"Successfully seeded {seeded_count} synthetic acquisition cases.",
        "count": seeded_count,
        "data_source": "SYNTHETIC_DEMO_DATA"
    }

@router.post("/reset")
def reset_demo_data(
    authorized: bool = Depends(verify_admin_authorization),
    db: Session = Depends(get_db)
):
    seeded_count = reset_and_reseed_database(db)
    return {
        "status": "RESET_COMPLETE",
        "message": f"Database reset and re-seeded with {seeded_count} deterministic demonstration cases.",
        "count": seeded_count,
        "data_source": "SYNTHETIC_DEMO_DATA"
    }
