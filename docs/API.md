# LandDelay AI — REST API Documentation

Base URI: `http://localhost:8000/api`
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 1. System Health
* **`GET /api/health`**
  - Returns service status, version, and operational mode.

---

## 2. Executive Dashboard
* **`GET /api/dashboard/summary`**
  - Query parameters: `project`, `district`, `stage`, `risk_category`, `data_source`
  - Returns calculated portfolio KPIs: total cases, high-risk cases, overdue milestone count, avg acquisition progress %, pending directives count, synthetic/verified count.
* **`GET /api/dashboard/charts`**
  - Query parameters: same as summary.
  - Returns risk category distribution, stage volume & average delay, 6-month progression, top corridor volume, and recent risk alerts.

---

## 3. Acquisition Cases
* **`GET /api/cases`**
  - Query parameters: `page`, `page_size`, `search`, `project`, `district`, `project_type`, `stage`, `risk_category`, `data_source`, `sort_by`, `sort_order`
  - Returns paginated acquisition cases with sequence metadata.
* **`GET /api/cases/{case_id}`**
  - Returns full dossier including case parameters, milestone progression, assigned directives, and audit history.
* **`POST /api/cases`**
  - Creates a new acquisition case with automatic initial milestone and risk scoring.
* **`PATCH /api/cases/{case_id}`**
  - Updates parameters (e.g., stage advancement, land acquired, disputes) and triggers immediate transparent risk recalculation.
* **`GET /api/cases/{case_id}/risk`**
  - Returns transparent risk breakdown: `risk_score`, `risk_category`, `rule_warnings`, `contributing_factors`, `recommended_actions`.

---

## 4. Action Center
* **`GET /api/actions`**
  - Query parameters: `status`, `priority`, `case_id`, `assigned_role`, `sort_by`, `sort_order`
  - Returns administrative follow-up directives with project context.
* **`POST /api/actions`**
  - Creates an administrative directive assigned to a specific role.
* **`PATCH /api/actions/{action_id}`**
  - Updates directive status (`OPEN`, `IN_PROGRESS`, `COMPLETED`), auto-stamping completion timestamp.

---

## 5. Geographic Mapping
* **`GET /api/map/cases`**
  - Returns parcels with verified non-null GPS coordinates, categorized by risk level.

---

## 6. Machine Learning & Model Evaluation
* **`GET /api/model/evaluation`**
  - Returns 80/20 train/test evaluation metrics for Baseline Logistic Regression and Tree Ensemble comparison, holdout confusion matrix, feature importance weights, and governance disclaimers.
* **`POST /api/predict`**
  - Simulates pre-outcome case parameters and returns predicted delay probability and top factors.

---

## 7. Data Ingestion & Demo Controls
* **`GET /api/import/template`**
  - Downloads standard CSV import template.
* **`POST /api/import/preview`**
  - Audits uploaded CSV file and returns validation report.
* **`POST /api/import/confirm`**
  - Ingests validated records inside an atomic database transaction.
* **`POST /api/demo/seed`**
  - Initializes database with deterministic synthetic demonstration data (seed=42).
* **`POST /api/demo/reset`**
  - Clears database and regenerates 250 deterministic demonstration cases.
