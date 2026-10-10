from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class BaseSchema(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

# Milestone Schemas
class MilestoneBase(BaseSchema):
    milestone_name: str
    stage_name: str
    planned_date: date
    actual_date: Optional[date] = None
    status: str = "PENDING"
    sequence_order: int = 1
    days_overdue: int = 0

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneResponse(MilestoneBase):
    id: int
    case_id: str

    class Config:
        from_attributes = True


# Action Item Schemas
class ActionItemBase(BaseSchema):
    title: str
    description: str
    priority: str = "MEDIUM" # HIGH, MEDIUM, LOW
    assigned_role: str
    due_date: date
    status: str = "OPEN" # OPEN, IN_PROGRESS, COMPLETED

class ActionItemCreate(ActionItemBase):
    case_id: str

class ActionItemUpdate(BaseSchema):
    status: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None

class ActionItemResponse(ActionItemBase):
    action_id: str
    case_id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    project_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True


# Audit Log Schemas
class AuditLogResponse(BaseSchema):
    id: int
    case_id: str
    action_type: str
    details: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Case Schemas
class CaseBase(BaseSchema):
    project_id: str
    project_name: str
    project_type: str
    state: str
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    land_required_hectares: float
    land_acquired_hectares: float = 0.0
    current_stage: str
    stage_entry_date: date
    planned_stage_date: date
    actual_stage_date: Optional[date] = None
    compensation_pending_pct: Optional[float] = 0.0
    open_dispute_count: int = 0
    documents_incomplete: bool = False
    data_source: str = "SYNTHETIC_DEMO_DATA"
    verification_status: str = "UNVERIFIED"

class CaseCreate(CaseBase):
    case_id: str

class CaseUpdate(BaseSchema):
    land_acquired_hectares: Optional[float] = None
    current_stage: Optional[str] = None
    planned_stage_date: Optional[date] = None
    actual_stage_date: Optional[date] = None
    compensation_pending_pct: Optional[float] = None
    open_dispute_count: Optional[int] = None
    documents_incomplete: Optional[bool] = None
    status: Optional[str] = None

class CaseResponse(CaseBase):
    case_id: str
    delay_days: int
    delayed: bool
    risk_score: float
    risk_category: str
    ml_delay_probability: Optional[float] = None
    status: str
    last_updated_at: datetime
    created_at: datetime
    milestones: List[MilestoneResponse] = []
    actions: List[ActionItemResponse] = []
    audit_logs: List[AuditLogResponse] = []

    class Config:
        from_attributes = True

class CaseListResponse(BaseSchema):
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Risk Engine schemas
class ContributingFactor(BaseSchema):
    factor: str
    impact: str # "HIGH", "MEDIUM", "LOW"
    weight_score: float
    description: str

class RiskAssessment(BaseSchema):
    case_id: str
    risk_score: float
    risk_category: str # "HIGH", "MEDIUM", "LOW"
    score_type: str # "RULE_BASED_SCORE" or "HYBRID_ML_SCORE"
    rule_warnings: List[str]
    contributing_factors: List[ContributingFactor]
    recommended_actions: List[Dict[str, str]]
    last_verified_update: datetime
    data_freshness_days: int
    model_version: str = "rules-engine-v1"
    data_source: str


# ML Prediction Schemas
class PredictionRequest(BaseSchema):
    case_id: Optional[str] = None
    project_type: str
    state: str
    district: str
    land_required_hectares: float
    current_stage: str
    days_in_stage: int
    compensation_pending_pct: float
    open_dispute_count: int
    documents_incomplete: bool

class PredictionResponse(BaseSchema):
    case_id: Optional[str] = None
    prediction_type: str = "DELAY_RISK_CLASSIFICATION"
    probability: float
    predicted_delayed: bool
    risk_category: str
    top_contributing_factors: List[Dict[str, Any]]
    model_version: str
    data_source_category: str
    prediction_timestamp: datetime
    validation_status: str


# Dashboard Schemas
class DashboardKPIs(BaseSchema):
    total_cases: int
    high_risk_cases: int
    medium_risk_cases: int
    low_risk_cases: int
    overdue_milestones_cases: int
    avg_acquisition_progress_pct: float
    pending_actions_count: int
    synthetic_cases_count: int
    verified_cases_count: int

class DashboardSummary(BaseSchema):
    kpis: DashboardKPIs

class StageDistributionItem(BaseSchema):
    stage: str
    count: int
    avg_delay_days: float

class RiskDistributionItem(BaseSchema):
    name: str
    count: int
    color: str

class MonthlyProgressionItem(BaseSchema):
    month: str
    cases_started: int
    cases_completed: int
    cases_delayed: int

class TopProjectItem(BaseSchema):
    project_id: str
    project_name: str
    total_cases: int
    high_risk_count: int
    avg_progress: float

class RecentAlertItem(BaseSchema):
    case_id: str
    project_name: str
    district: str
    current_stage: str
    risk_score: float
    risk_category: str
    primary_warning: str
    updated_at: datetime

class DashboardCharts(BaseSchema):
    risk_distribution: List[RiskDistributionItem]
    stage_distribution: List[StageDistributionItem]
    monthly_progression: List[MonthlyProgressionItem]
    top_projects: List[TopProjectItem]
    recent_alerts: List[RecentAlertItem]


# Import Schemas
class CSVValidationError(BaseSchema):
    row_number: int
    case_id: Optional[str] = None
    field: str
    error: str

class ImportPreviewResponse(BaseSchema):
    total_rows: int
    valid_rows_count: int
    invalid_rows_count: int
    errors: List[CSVValidationError]
    sample_records: List[Dict[str, Any]]
    valid_records: List[Dict[str, Any]] = []
    data_source_detected: str

class ImportConfirmRequest(BaseSchema):
    data_source: str # VERIFIED_PUBLIC_DATA or SYNTHETIC_DEMO_DATA
    records: List[Dict[str, Any]]

class ImportResultResponse(BaseSchema):
    status: str
    imported_count: int
    data_source: str
    message: str


# Model Evaluation
class ModelMetrics(BaseSchema):
    model_name: str
    dataset_type: str # SYNTHETIC_DEMO_DATA or VERIFIED_PUBLIC_DATA
    total_records: int
    train_count: int
    test_count: int
    target_definition: str
    class_balance: Dict[str, int]
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    pr_auc: Optional[float] = None
    brier_score: Optional[float] = None
    confusion_matrix: List[List[int]]
    validation_method: str
    validation_status: str # NOT_VALIDATED_ON_REAL_DATA or VALIDATED
    is_synthetic: bool = True
    disclaimer: str

class ModelEvaluationResponse(BaseSchema):
    baseline_logistic_regression: ModelMetrics
    comparison_random_forest: Optional[ModelMetrics] = None
    feature_importance: List[Dict[str, Any]]
