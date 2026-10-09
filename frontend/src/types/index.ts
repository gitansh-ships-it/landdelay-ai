export type RiskCategory = 'HIGH' | 'MEDIUM' | 'LOW';
export type DataSource = 'SYNTHETIC_DEMO_DATA' | 'VERIFIED_PUBLIC_DATA';
export type CaseStatus = 'IN_PROGRESS' | 'COMPLETED' | 'STALLED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface Milestone {
  id: number;
  case_id: string;
  milestone_name: string;
  stage_name: string;
  planned_date: string;
  actual_date?: string | null;
  status: MilestoneStatus;
  sequence_order: number;
  days_overdue: number;
}

export interface ActionItem {
  action_id: string;
  case_id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  assigned_role: string;
  due_date: string;
  status: ActionStatus;
  created_at: string;
  completed_at?: string | null;
  project_name?: string;
  district?: string;
}

export interface AuditLog {
  id: number;
  case_id: string;
  action_type: string;
  details: string;
  timestamp: string;
}

export interface AcquisitionCase {
  case_id: string;
  project_id: string;
  project_name: string;
  project_type: string;
  state: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  land_required_hectares: number;
  land_acquired_hectares: number;
  current_stage: string;
  stage_entry_date: string;
  planned_stage_date: string;
  actual_stage_date?: string | null;
  compensation_pending_pct?: number | null;
  open_dispute_count: number;
  documents_incomplete: boolean;
  delay_days: number;
  delayed: boolean;
  data_source: DataSource;
  verification_status: string;
  risk_score: number;
  risk_category: RiskCategory;
  ml_delay_probability?: number | null;
  status: CaseStatus;
  last_updated_at: string;
  created_at: string;
  milestones?: Milestone[];
  actions?: ActionItem[];
  audit_logs?: AuditLog[];
}

export interface CaseListResponse {
  items: AcquisitionCase[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ContributingFactor {
  factor: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  weight_score: number;
  description: string;
}

export interface RecommendedAction {
  title: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assigned_role: string;
}

export interface RiskAssessment {
  case_id: string;
  risk_score: number;
  risk_category: RiskCategory;
  score_type: string;
  rule_warnings: string[];
  contributing_factors: ContributingFactor[];
  recommended_actions: RecommendedAction[];
  last_verified_update: string;
  data_freshness_days: number;
  model_version: string;
  data_source: DataSource;
}

export interface DashboardKPIs {
  total_cases: number;
  high_risk_cases: number;
  medium_risk_cases: number;
  low_risk_cases: number;
  overdue_milestones_cases: number;
  avg_acquisition_progress_pct: number;
  pending_actions_count: number;
  synthetic_cases_count: number;
  verified_cases_count: number;
}

export interface DashboardSummary {
  kpis: DashboardKPIs;
}

export interface RiskDistributionItem {
  name: string;
  count: number;
  color: string;
}

export interface StageDistributionItem {
  stage: string;
  count: number;
  avg_delay_days: number;
}

export interface MonthlyProgressionItem {
  month: string;
  cases_started: number;
  cases_completed: number;
  cases_delayed: number;
}

export interface TopProjectItem {
  project_id: string;
  project_name: string;
  total_cases: number;
  high_risk_count: number;
  avg_progress: number;
}

export interface RecentAlertItem {
  case_id: string;
  project_name: string;
  district: string;
  current_stage: string;
  risk_score: number;
  risk_category: RiskCategory;
  primary_warning: string;
  updated_at: string;
}

export interface DashboardCharts {
  risk_distribution: RiskDistributionItem[];
  stage_distribution: StageDistributionItem[];
  monthly_progression: MonthlyProgressionItem[];
  top_projects: TopProjectItem[];
  recent_alerts: RecentAlertItem[];
}

export interface PredictionResponse {
  case_id?: string | null;
  prediction_type: string;
  probability: number;
  predicted_delayed: boolean;
  risk_category: string;
  top_contributing_factors: Array<{
    factor: string;
    impact: string;
  }>;
  model_version: string;
  data_source_category: string;
  prediction_timestamp: string;
  validation_status: string;
}

export interface ModelMetrics {
  model_name: string;
  dataset_type: string;
  total_records: number;
  train_count: number;
  test_count: number;
  target_definition: string;
  class_balance: Record<string, number>;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  pr_auc?: number | null;
  brier_score?: number | null;
  confusion_matrix: number[][];
  validation_method: string;
  validation_status: string;
  is_synthetic: boolean;
  disclaimer: string;
}

export interface ModelEvaluationResponse {
  baseline_logistic_regression: ModelMetrics;
  comparison_random_forest?: ModelMetrics | null;
  feature_importance: Array<{
    feature: string;
    importance: number;
    direction: string;
  }>;
}

export interface CSVValidationError {
  row_number: number;
  case_id?: string | null;
  field: string;
  error: string;
}

export interface ImportPreviewResponse {
  total_rows: number;
  valid_rows_count: number;
  invalid_rows_count: number;
  errors: CSVValidationError[];
  sample_records: Record<string, any>[];
  data_source_detected: string;
}

export interface MapCaseItem {
  case_id: string;
  project_id: string;
  project_name: string;
  project_type: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_category: RiskCategory;
  current_stage: string;
  delay_days: number;
  land_required_hectares: number;
  land_acquired_hectares: number;
  data_source: DataSource;
  verification_status: string;
}

export interface MapResponse {
  total_cases: number;
  mapped_count: number;
  unmapped_count: number;
  cases: MapCaseItem[];
}
