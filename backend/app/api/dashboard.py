from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import Optional, List
from datetime import datetime, date, timedelta
from app.db.database import get_db
from app.models.case import AcquisitionCase, Milestone, ActionItem
from app.schemas.case import (
    DashboardSummary, DashboardKPIs, DashboardCharts,
    RiskDistributionItem, StageDistributionItem, MonthlyProgressionItem,
    TopProjectItem, RecentAlertItem
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def apply_case_filters(
    query,
    project: Optional[str] = None,
    district: Optional[str] = None,
    stage: Optional[str] = None,
    risk_category: Optional[str] = None,
    data_source: Optional[str] = None
):
    if project:
        query = query.filter(or_(AcquisitionCase.project_name.ilike(f"%{project}%"), AcquisitionCase.project_id == project))
    if district:
        query = query.filter(AcquisitionCase.district.ilike(f"%{district}%"))
    if stage:
        query = query.filter(AcquisitionCase.current_stage == stage)
    if risk_category:
        query = query.filter(AcquisitionCase.risk_category == risk_category.upper())
    if data_source:
        query = query.filter(AcquisitionCase.data_source == data_source)
    return query

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    project: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    data_source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    base_query = db.query(AcquisitionCase)
    filtered = apply_case_filters(base_query, project, district, stage, risk_category, data_source)
    
    total_cases = filtered.count()
    if total_cases == 0:
        return DashboardSummary(
            kpis=DashboardKPIs(
                total_cases=0,
                high_risk_cases=0,
                medium_risk_cases=0,
                low_risk_cases=0,
                overdue_milestones_cases=0,
                avg_acquisition_progress_pct=0.0,
                pending_actions_count=0,
                synthetic_cases_count=0,
                verified_cases_count=0
            )
        )

    high_risk = filtered.filter(AcquisitionCase.risk_category == "HIGH").count()
    med_risk = filtered.filter(AcquisitionCase.risk_category == "MEDIUM").count()
    low_risk = filtered.filter(AcquisitionCase.risk_category == "LOW").count()

    today = date.today()
    overdue_milestones = filtered.filter(
        AcquisitionCase.planned_stage_date < today,
        AcquisitionCase.actual_stage_date.is_(None)
    ).count()

    # Calculate average acquisition progress %
    all_cases = filtered.all()
    progress_sum = 0.0
    for c in all_cases:
        if c.land_required_hectares > 0:
            pct = min(100.0, (c.land_acquired_hectares / c.land_required_hectares) * 100.0)
            progress_sum += pct
    avg_progress = round(progress_sum / total_cases, 1)

    pending_actions = db.query(ActionItem).filter(ActionItem.status.in_(["OPEN", "IN_PROGRESS"])).count()
    synthetic_cases = filtered.filter(AcquisitionCase.data_source == "SYNTHETIC_DEMO_DATA").count()
    verified_cases = filtered.filter(AcquisitionCase.data_source == "VERIFIED_PUBLIC_DATA").count()

    return DashboardSummary(
        kpis=DashboardKPIs(
            total_cases=total_cases,
            high_risk_cases=high_risk,
            medium_risk_cases=med_risk,
            low_risk_cases=low_risk,
            overdue_milestones_cases=overdue_milestones,
            avg_acquisition_progress_pct=avg_progress,
            pending_actions_count=pending_actions,
            synthetic_cases_count=synthetic_cases,
            verified_cases_count=verified_cases
        )
    )

@router.get("/charts", response_model=DashboardCharts)
def get_dashboard_charts(
    project: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    data_source: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    base_query = db.query(AcquisitionCase)
    filtered = apply_case_filters(base_query, project, district, stage, risk_category, data_source)

    # 1. Risk distribution
    high_count = filtered.filter(AcquisitionCase.risk_category == "HIGH").count()
    med_count = filtered.filter(AcquisitionCase.risk_category == "MEDIUM").count()
    low_count = filtered.filter(AcquisitionCase.risk_category == "LOW").count()

    risk_dist = [
        RiskDistributionItem(name="High Risk", count=high_count, color="#ef4444"),
        RiskDistributionItem(name="Medium Risk", count=med_count, color="#f59e0b"),
        RiskDistributionItem(name="Low Risk", count=low_count, color="#10b981")
    ]

    # 2. Stage distribution
    stages = [
        "Preliminary Notification",
        "Survey & Boundary Demarcation",
        "Public Hearing & Objections",
        "Declaration & Final Scheme",
        "Valuation & Award Determination",
        "Compensation Disbursement",
        "Possession & Physical Handover"
    ]
    stage_dist = []
    for s in stages:
        s_cases = filtered.filter(AcquisitionCase.current_stage == s).all()
        count = len(s_cases)
        avg_delay = round(sum(c.delay_days for c in s_cases) / count, 1) if count > 0 else 0.0
        stage_dist.append(StageDistributionItem(stage=s, count=count, avg_delay_days=avg_delay))

    # 3. Monthly case progression (last 6 months)
    monthly = []
    today = date.today()
    for m_offset in range(5, -1, -1):
        total_months = today.year * 12 + today.month - 1 - m_offset
        y = total_months // 12
        m = total_months % 12 + 1
        start_dt = date(y, m, 1)
        next_dt = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
        m_name = start_dt.strftime("%b %Y")

        started = filtered.filter(
            AcquisitionCase.stage_entry_date >= start_dt,
            AcquisitionCase.stage_entry_date < next_dt
        ).count()
        completed = filtered.filter(
            AcquisitionCase.actual_stage_date >= start_dt,
            AcquisitionCase.actual_stage_date < next_dt
        ).count()
        delayed = filtered.filter(
            AcquisitionCase.delayed == True,
            AcquisitionCase.stage_entry_date >= start_dt,
            AcquisitionCase.stage_entry_date < next_dt
        ).count()
        monthly.append(MonthlyProgressionItem(
            month=m_name,
            cases_started=started,
            cases_completed=completed,
            cases_delayed=delayed
        ))

    # 4. Top projects with pending acquisition cases
    projects_query = db.query(
        AcquisitionCase.project_id,
        AcquisitionCase.project_name,
        func.count(AcquisitionCase.case_id).label("total")
    ).group_by(AcquisitionCase.project_id, AcquisitionCase.project_name).order_by(desc("total")).limit(5).all()

    top_projects = []
    for p_id, p_name, tot in projects_query:
        p_cases = db.query(AcquisitionCase).filter(AcquisitionCase.project_id == p_id).all()
        high_cnt = sum(1 for c in p_cases if c.risk_category == "HIGH")
        prog_sum = sum((c.land_acquired_hectares / c.land_required_hectares * 100.0) for c in p_cases if c.land_required_hectares > 0)
        avg_prg = round(prog_sum / tot, 1) if tot > 0 else 0.0
        top_projects.append(TopProjectItem(
            project_id=p_id,
            project_name=p_name,
            total_cases=tot,
            high_risk_count=high_cnt,
            avg_progress=avg_prg
        ))

    # 5. Recent alerts
    recent_cases = filtered.order_by(desc(AcquisitionCase.risk_score), desc(AcquisitionCase.last_updated_at)).limit(5).all()
    recent_alerts = []
    for c in recent_cases:
        p_warning = "Milestone deadline exceeded" if c.delay_days > 0 else (
            f"{c.open_dispute_count} boundary dispute(s)" if c.open_dispute_count > 0 else (
                "Statutory documentation missing" if c.documents_incomplete else "Normal Monitoring"
            )
        )
        recent_alerts.append(RecentAlertItem(
            case_id=c.case_id,
            project_name=c.project_name,
            district=f"{c.district}, {c.state}",
            current_stage=c.current_stage,
            risk_score=c.risk_score,
            risk_category=c.risk_category,
            primary_warning=p_warning,
            updated_at=c.last_updated_at
        ))

    return DashboardCharts(
        risk_distribution=risk_dist,
        stage_distribution=stage_dist,
        monthly_progression=monthly,
        top_projects=top_projects,
        recent_alerts=recent_alerts
    )
