from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import Optional, List
from datetime import datetime
import uuid
from app.db.database import get_db
from app.models.case import ActionItem, AcquisitionCase, AuditLog
from app.schemas.case import ActionItemResponse, ActionItemCreate, ActionItemUpdate

router = APIRouter(prefix="/actions", tags=["Action Center"])

@router.get("", response_model=List[ActionItemResponse])
def list_actions(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    assigned_role: Optional[str] = Query(None),
    sort_by: str = Query("due_date"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db)
):
    query = db.query(ActionItem)

    if status:
        query = query.filter(ActionItem.status == status.upper())
    if priority:
        query = query.filter(ActionItem.priority == priority.upper())
    if case_id:
        query = query.filter(ActionItem.case_id == case_id)
    if assigned_role:
        query = query.filter(ActionItem.assigned_role == assigned_role)

    sort_col = getattr(ActionItem, sort_by, ActionItem.due_date)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    items = query.all()
    
    # Enrich with project name and district
    results = []
    case_map = {c.case_id: c for c in db.query(AcquisitionCase).all()}
    for item in items:
        resp = ActionItemResponse.from_orm(item)
        if item.case_id in case_map:
            c = case_map[item.case_id]
            resp.project_name = c.project_name
            resp.district = f"{c.district}, {c.state}"
        results.append(resp)

    return results

@router.post("", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
def create_action(payload: ActionItemCreate, db: Session = Depends(get_db)):
    case = db.query(AcquisitionCase).filter(AcquisitionCase.case_id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case '{payload.case_id}' does not exist")

    action_id = f"ACT-{uuid.uuid4().hex[:8].upper()}"
    new_action = ActionItem(
        action_id=action_id,
        case_id=payload.case_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority.upper(),
        assigned_role=payload.assigned_role,
        due_date=payload.due_date,
        status="OPEN",
        created_at=datetime.utcnow()
    )

    audit = AuditLog(
        case_id=payload.case_id,
        action_type="ACTION_CREATED",
        details=f"Assigned follow-up action '{payload.title}' to {payload.assigned_role} (Priority: {payload.priority})",
        timestamp=datetime.utcnow()
    )

    db.add(new_action)
    db.add(audit)
    db.commit()
    db.refresh(new_action)

    resp = ActionItemResponse.from_orm(new_action)
    resp.project_name = case.project_name
    resp.district = f"{case.district}, {case.state}"
    return resp

@router.patch("/{action_id}", response_model=ActionItemResponse)
def update_action(action_id: str, payload: ActionItemUpdate, db: Session = Depends(get_db)):
    action = db.query(ActionItem).filter(ActionItem.action_id == action_id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Action '{action_id}' not found")

    if payload.status is not None:
        action.status = payload.status.upper()
        if action.status == "COMPLETED" and not action.completed_at:
            action.completed_at = datetime.utcnow()
        elif action.status != "COMPLETED":
            action.completed_at = None

    if payload.priority is not None:
        action.priority = payload.priority.upper()
    if payload.title is not None:
        action.title = payload.title
    if payload.description is not None:
        action.description = payload.description
    if payload.due_date is not None:
        action.due_date = payload.due_date

    audit = AuditLog(
        case_id=action.case_id,
        action_type="ACTION_UPDATED",
        details=f"Action '{action.title}' updated. Current status: {action.status}",
        timestamp=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(action)

    case = db.query(AcquisitionCase).filter(AcquisitionCase.case_id == action.case_id).first()
    resp = ActionItemResponse.from_orm(action)
    if case:
        resp.project_name = case.project_name
        resp.district = f"{case.district}, {case.state}"
    return resp
