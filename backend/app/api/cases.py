from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from typing import Optional
from datetime import datetime, date
from app.db.database import get_db
from app.models.case import AcquisitionCase, Milestone, ActionItem, AuditLog
from app.schemas.case import (
    CaseResponse, CaseListResponse, CaseCreate, CaseUpdate,
    RiskAssessment
)
from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/cases", tags=["Acquisition Cases"])

@router.get("", response_model=CaseListResponse)
def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=500),
    search: Optional[str] = Query(None),
    project: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    data_source: Optional[str] = Query(None),
    sort_by: str = Query("last_updated_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(AcquisitionCase)

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AcquisitionCase.case_id.ilike(search_term),
                AcquisitionCase.project_name.ilike(search_term),
                AcquisitionCase.district.ilike(search_term),
                AcquisitionCase.state.ilike(search_term)
            )
        )

    if project:
        query = query.filter(or_(AcquisitionCase.project_name.ilike(f"%{project}%"), AcquisitionCase.project_id == project))
    if district:
        query = query.filter(AcquisitionCase.district.ilike(f"%{district}%"))
    if project_type:
        query = query.filter(AcquisitionCase.project_type == project_type)
    if stage:
        query = query.filter(AcquisitionCase.current_stage == stage)
    if risk_category:
        query = query.filter(AcquisitionCase.risk_category == risk_category.upper())
    if data_source:
        query = query.filter(AcquisitionCase.data_source == data_source)

    # Sorting
    sort_column = getattr(AcquisitionCase, sort_by, AcquisitionCase.last_updated_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return CaseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case '{case_id}' not found")
    return case

@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    existing = db.query(AcquisitionCase).filter(AcquisitionCase.case_id == payload.case_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Case ID '{payload.case_id}' already exists")

    today = date.today()
    is_delayed = payload.planned_stage_date < today and not payload.actual_stage_date
    delay_days = max(0, (today - payload.planned_stage_date).days) if is_delayed else 0

    case = AcquisitionCase(
        case_id=payload.case_id,
        project_id=payload.project_id,
        project_name=payload.project_name,
        project_type=payload.project_type,
        state=payload.state,
        district=payload.district,
        latitude=payload.latitude,
        longitude=payload.longitude,
        land_required_hectares=payload.land_required_hectares,
        land_acquired_hectares=payload.land_acquired_hectares,
        current_stage=payload.current_stage,
        stage_entry_date=payload.stage_entry_date,
        planned_stage_date=payload.planned_stage_date,
        actual_stage_date=payload.actual_stage_date,
        compensation_pending_pct=payload.compensation_pending_pct,
        open_dispute_count=payload.open_dispute_count,
        documents_incomplete=payload.documents_incomplete,
        data_source=payload.data_source,
        verification_status=payload.verification_status,
        delay_days=delay_days,
        delayed=is_delayed,
        status="IN_PROGRESS",
        last_updated_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )

    ms = Milestone(
        case_id=case.case_id,
        milestone_name=f"{case.current_stage} Completion",
        stage_name=case.current_stage,
        planned_date=payload.planned_stage_date,
        actual_date=payload.actual_stage_date,
        status="COMPLETED" if payload.actual_stage_date else ("OVERDUE" if is_delayed else "IN_PROGRESS"),
        sequence_order=1,
        days_overdue=delay_days
    )
    case.milestones = [ms]

    # Evaluate risk score
    risk_res = risk_engine.evaluate(case)
    case.risk_score = risk_res.risk_score
    case.risk_category = risk_res.risk_category

    audit = AuditLog(
        case_id=case.case_id,
        action_type="MANUAL_CREATION",
        details="Case record registered manually via portal.",
        timestamp=datetime.utcnow()
    )
    case.audit_logs = [audit]

    db.add(case)
    db.commit()
    db.refresh(case)
    return case

@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(case_id: str, payload: CaseUpdate, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case '{case_id}' not found")

    changes = []
    if payload.land_acquired_hectares is not None:
        changes.append(f"Land acquired updated to {payload.land_acquired_hectares} ha")
        case.land_acquired_hectares = payload.land_acquired_hectares
    if payload.current_stage is not None and payload.current_stage != case.current_stage:
        changes.append(f"Stage changed from '{case.current_stage}' to '{payload.current_stage}'")
        case.current_stage = payload.current_stage
        case.stage_entry_date = date.today()
    if payload.planned_stage_date is not None:
        case.planned_stage_date = payload.planned_stage_date
    if payload.actual_stage_date is not None:
        case.actual_stage_date = payload.actual_stage_date
        changes.append(f"Stage completed on {payload.actual_stage_date}")
    if payload.compensation_pending_pct is not None:
        case.compensation_pending_pct = payload.compensation_pending_pct
    if payload.open_dispute_count is not None:
        case.open_dispute_count = payload.open_dispute_count
    if payload.documents_incomplete is not None:
        case.documents_incomplete = payload.documents_incomplete
    if payload.status is not None:
        case.status = payload.status

    today = date.today()
    if case.actual_stage_date:
        case.delayed = case.actual_stage_date > case.planned_stage_date
        case.delay_days = max(0, (case.actual_stage_date - case.planned_stage_date).days)
        case.status = "COMPLETED"
    else:
        case.delayed = case.planned_stage_date < today
        case.delay_days = max(0, (today - case.planned_stage_date).days) if case.delayed else 0

    case.last_updated_at = datetime.utcnow()

    # Re-evaluate transparent risk engine
    risk_res = risk_engine.evaluate(case)
    case.risk_score = risk_res.risk_score
    case.risk_category = risk_res.risk_category

    if changes:
        audit = AuditLog(
            case_id=case.case_id,
            action_type="RECORD_UPDATE",
            details="; ".join(changes),
            timestamp=datetime.utcnow()
        )
        db.add(audit)

    db.commit()
    db.refresh(case)
    return case

@router.get("/{case_id}/risk", response_model=RiskAssessment)
def get_case_risk(case_id: str, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case '{case_id}' not found")
    
    return risk_engine.evaluate(case)
