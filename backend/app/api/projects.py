from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.db.database import get_db
from app.models.case import AcquisitionCase

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("")
def list_projects(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    projects_query = db.query(
        AcquisitionCase.project_id,
        AcquisitionCase.project_name,
        AcquisitionCase.project_type,
        func.count(AcquisitionCase.case_id).label("total_cases"),
        func.sum(AcquisitionCase.land_required_hectares).label("total_required"),
        func.sum(AcquisitionCase.land_acquired_hectares).label("total_acquired")
    ).group_by(
        AcquisitionCase.project_id,
        AcquisitionCase.project_name,
        AcquisitionCase.project_type
    ).all()

    results = []
    for p_id, p_name, p_type, tot, req, acq in projects_query:
        cases = db.query(AcquisitionCase).filter(AcquisitionCase.project_id == p_id).all()
        high_risk_count = sum(1 for c in cases if c.risk_category == "HIGH")
        delayed_count = sum(1 for c in cases if c.delayed)
        avg_risk = round(sum(c.risk_score for c in cases) / tot, 1) if tot > 0 else 0.0

        results.append({
            "project_id": p_id,
            "project_name": p_name,
            "project_type": p_type,
            "total_cases": tot,
            "high_risk_cases": high_risk_count,
            "delayed_cases": delayed_count,
            "total_land_required_hectares": round(req or 0.0, 2),
            "total_land_acquired_hectares": round(acq or 0.0, 2),
            "average_risk_score": avg_risk
        })

    return results

@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    cases = db.query(AcquisitionCase).filter(AcquisitionCase.project_id == project_id).all()
    if not cases:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project '{project_id}' not found")

    p_first = cases[0]
    total = len(cases)
    high_risk = sum(1 for c in cases if c.risk_category == "HIGH")
    req = sum(c.land_required_hectares for c in cases)
    acq = sum(c.land_acquired_hectares for c in cases)

    return {
        "project_id": project_id,
        "project_name": p_first.project_name,
        "project_type": p_first.project_type,
        "total_cases": total,
        "high_risk_cases": high_risk,
        "total_land_required_hectares": round(req, 2),
        "total_land_acquired_hectares": round(acq, 2),
        "cases": [
            {
                "case_id": c.case_id,
                "district": f"{c.district}, {c.state}",
                "current_stage": c.current_stage,
                "risk_category": c.risk_category,
                "risk_score": c.risk_score,
                "delayed": c.delayed,
                "delay_days": c.delay_days
            }
            for c in cases
        ]
    }
