# LandDelay AI

> **Predictive Analytics System for Early Detection of Land Acquisition Delays**
> Built for GovernmentTech, Infrastructure Monitoring & Administrative Decision Support.

---

## 🏛️ Executive Summary

**LandDelay AI** provides infrastructure project directors, monitoring officers, and land acquisition authorities with an early-warning intelligence platform. The system continuously evaluates land parcel acquisition milestones, flags emerging schedule risks using a transparent, auditable rules engine, and models delay likelihood with a supervised machine learning baseline.

*Decision-Support Scope:* The system acts exclusively as an administrative decision-support assistant. It does not decide land ownership, award legal compensation, or make judicial determinations.

---

## 🛠️ Technology Stack

- **Backend:** Python (FastAPI, SQLAlchemy, Pydantic v2, SQLite)
- **Data & ML:** Pandas, NumPy (Pure NumPy Logistic Regression baseline + Decision Tree / Ensemble comparison, avoiding brittle binary C-extension DLL issues)
- **Frontend:** React 18 / 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, React Router v6, Leaflet & React Leaflet (OpenStreetMap)
- **Testing:** Pytest (11/11 automated tests passing), Vite production build validation

---

## 🚀 Quickstart Guide (Windows PowerShell)

Open two separate Windows PowerShell terminals in `c:\Users\GITANSH-PC\Desktop\landdelay`:

### Terminal 1: Backend API (FastAPI)

```powershell
# Set backend module path and run FastAPI
$env:PYTHONPATH="backend"
& "C:\Users\GITANSH-PC\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* Backend will automatically initialize `landdelay.db` and auto-seed 250 deterministic cases if the database is clean.
* Interactive API Documentation (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
* Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Terminal 2: Frontend (Vite + React)

```powershell
cd frontend
npm run dev
```

* Open your browser at [http://localhost:5173](http://localhost:5173)
* The Vite dev server proxies API calls to `http://127.0.0.1:8000`.

---

## 🧪 Automated Testing

Run the automated backend test suite:

```powershell
$env:PYTHONPATH="backend"
& "C:\Users\GITANSH-PC\AppData\Local\Programs\Python\Python312\python.exe" -m pytest backend/tests/test_backend.py -v
```

**Results:** 11 / 11 tests PASSED in 1.2s:
- Health endpoint validation
- Database-backed live KPI calculation
- Recharts dynamic chart structures
- Case registry search, filtering & pagination
- Detailed dossier & milestone inspection
- Transparent Risk Engine & Overdue Milestone override
- Action Item lifecycle (Open -> In Progress -> Completed)
- Supervised Model Evaluation & holdout confusion matrix
- Geographic coordinates validation (verified vs unmapped)
- Project-level aggregation
- CSV import template download

Run the frontend production build check:

```powershell
cd frontend
npm run build
```

**Result:** Compiled and verified in 514ms with zero errors.

---

## 🌟 Application Features & Navigation

The persistent sidebar gives access to 8 operational workspaces:

1. **Executive Overview (`/`):**
   - Live KPI cards: Total cases, High-risk parcels, Overdue milestones, Average land handover progress, Pending directives.
   - Dynamic charts: Risk breakdown donut, Statutory stage distribution with average delay days, 6-month case progression area chart, top infrastructure corridors.
   - Real-time filters by project, district, stage, and risk tier.

2. **Acquisition Cases Registry (`/cases`):**
   - Searchable, sortable, paginated table of parcels.
   - Column-level metrics: Land required vs acquired, delay slippage, documentation indicators, open dispute counters, risk badges.
   - Filter by Sector (Highway, Railway, Metro, Energy, Airport) and Data Source.
   - One-click CSV export and "+ Register New Case" modal.

3. **Case Detail Dossier (`/cases/:caseId`):**
   - Parcel summary & possession progress bar.
   - Chronological statutory milestone timeline with planned vs actual completion dates and overdue day counters.
   - Transparent Risk Evaluation breakdown with observable evidence and point allocations.
   - Non-binding administrative follow-up recommendations with one-click adoption into Action Center.
   - Statutory audit log tracking status transitions and parameters updates.
   - Parameter update modal with instant score recalculation.

4. **Predictive Delay Analytics (`/risk-analytics`):**
   - Portfolio risk histogram across score bands (0-20, 21-40, 41-60, 61-80, 81-100).
   - Statutory rule trigger frequency analysis.
   - Interactive Risk Engine Sandbox: Adjust days overdue, compensation unreleased, and disputes in real time to observe rule engine scoring.

5. **Geographic Infrastructure Map (`/map`):**
   - Interactive Leaflet map with OpenStreetMap tiles.
   - Spatially plots parcels with verified GPS coordinates (color-coded by risk level).
   - Strict provenance rule: Never fabricates coordinates for missing records. Unmapped cases are counted and reported transparently.
   - Clickable parcel markers with details popup and dossier navigation link.

6. **Action Center (`/actions`):**
   - Task lifecycle management for administrative directives (`OPEN`, `IN_PROGRESS`, `COMPLETED`).
   - Filter by priority (`HIGH`, `MEDIUM`, `LOW`) and assigned officer role (Collector, Valuation Officer, Legal Counsel).
   - Quick status toggle buttons with automatic completion timestamp recording.

7. **Data Management & Ingestion (`/data`):**
   - Mandatory separation between `VERIFIED_PUBLIC_DATA` and `SYNTHETIC_DEMO_DATA`.
   - Downloadable standard CSV import template.
   - Upload CSV with pre-import validation report (catches missing headers, invalid bounds, duplicate IDs, invalid percentages).
   - Atomic database ingestion.
   - Deterministic demo data controls: Reset & reseed 250 simulated cases with fixed seed (`42`).

8. **Predictive Model Evaluation (`/model`):**
   - Persistent prominent disclosure: *"SYNTHETIC-DATA EVALUATION — NOT EVIDENCE OF REAL-WORLD PREDICTIVE PERFORMANCE."*
   - Performance metrics comparison: Accuracy, Precision, Recall, F1 Score, Brier Score Loss, PR-AUC.
   - 2x2 Holdout Confusion Matrix (TN, FP, FN, TP).
   - Pre-outcome feature importance ranking.
   - Interactive ML Prediction Sandbox: Enter parameters to compute live probability and top factors.

9. **System Settings (`/settings`):**
   - Configurable risk score cutoffs (High risk: 70, Medium risk: 40).
   - Configurable rule weight point allocations.
   - Service health diagnostics and database mode reporting.

---

## 🔒 Data Integrity & Governance Principles

1. **No External AI APIs Required:**
   Operates 100% locally with zero external cloud dependencies or API keys.
2. **Transparent Rules First:**
   Classification is rooted in auditable, deterministic criteria. Critical milestones overdue by >= 30 days trigger an automatic High Risk escalation override.
3. **No Fabricated Locations:**
   Verified public records without verified GPS coordinates remain unmapped rather than plotted with invented coordinates.
4. **Data Leakage Prevention:**
   The ML pipeline excludes post-outcome information (actual completion dates, final delay days).
