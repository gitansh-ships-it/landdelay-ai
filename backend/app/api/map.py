from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List, Dict, Any
from app.db.database import get_db
from app.models.case import AcquisitionCase

router = APIRouter(prefix="/map", tags=["Geographic View"])

@router.get("/cases")
def get_map_cases(
    project: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    query = db.query(AcquisitionCase)

    if project:
        query = query.filter(or_(AcquisitionCase.project_name.ilike(f"%{project}%"), AcquisitionCase.project_id == project))
    if district:
        query = query.filter(AcquisitionCase.district.ilike(f"%{district}%"))
    if risk_category:
        query = query.filter(AcquisitionCase.risk_category == risk_category.upper())

    all_cases = query.all()
    mapped_cases = []
    unmapped_count = 0

    for c in all_cases:
        if c.latitude is not None and c.longitude is not None:
            mapped_cases.append({
                "case_id": c.case_id,
                "project_id": c.project_id,
                "project_name": c.project_name,
                "project_type": c.project_type,
                "state": c.state,
                "district": c.district,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "risk_score": c.risk_score,
                "risk_category": c.risk_category,
                "current_stage": c.current_stage,
                "delay_days": c.delay_days,
                "land_required_hectares": c.land_required_hectares,
                "land_acquired_hectares": c.land_acquired_hectares,
                "data_source": c.data_source,
                "verification_status": c.verification_status
            })
        else:
            unmapped_count += 1

    return {
        "total_cases": len(all_cases),
        "mapped_count": len(mapped_cases),
        "unmapped_count": unmapped_count,
        "cases": mapped_cases
    }
