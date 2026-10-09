import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.models.case import AcquisitionCase, Milestone, ActionItem
from app.services.risk_engine import risk_engine
from app.services.ml_service import ml_service
from app.services.import_service import import_service
from app.services.demo_service import generate_synthetic_dataset, reset_and_reseed_database

from app.core.config import settings

client = TestClient(app)

ADMIN_HEADER = {"X-Admin-Key": settings.ADMIN_RESET_KEY}

@pytest.fixture(autouse=True, scope="module")
def ensure_db_seeded():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(AcquisitionCase).count() < 200:
            generate_synthetic_dataset(db, 250)
    finally:
        db.close()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "LandDelay AI"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    kpis = data["kpis"]
    assert kpis["total_cases"] >= 200
    assert kpis["high_risk_cases"] > 0
    assert kpis["avg_acquisition_progress_pct"] >= 0.0

def test_dashboard_charts():
    response = client.get("/api/dashboard/charts")
    assert response.status_code == 200
    data = response.json()
    assert len(data["risk_distribution"]) == 3
    assert len(data["stage_distribution"]) > 0
    assert len(data["top_projects"]) > 0

def test_cases_list_and_search():
    response = client.get("/api/cases?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 200
    assert len(data["items"]) == 10

    # Search by case_id
    first_id = data["items"][0]["case_id"]
    res_search = client.get(f"/api/cases?search={first_id}")
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) >= 1

def test_case_detail_and_risk():
    res = client.get("/api/cases?page=1&page_size=1")
    first_id = res.json()["items"][0]["case_id"]

    res_detail = client.get(f"/api/cases/{first_id}")
    assert res_detail.status_code == 200
    case_data = res_detail.json()
    assert case_data["case_id"] == first_id
    assert len(case_data["milestones"]) > 0

    res_risk = client.get(f"/api/cases/{first_id}/risk")
    assert res_risk.status_code == 200
    risk_data = res_risk.json()
    assert risk_data["score_type"] == "RULE_BASED_SCORE"
    assert risk_data["risk_category"] in ["HIGH", "MEDIUM", "LOW"]

def test_risk_engine_overdue_override():
    today = date.today()
    c = AcquisitionCase(
        case_id="TEST-OVERDUE-01",
        project_id="P-01",
        project_name="Test Rail",
        project_type="Railway",
        state="Haryana",
        district="Rewari",
        land_required_hectares=10.0,
        land_acquired_hectares=2.0,
        current_stage="Survey & Boundary Demarcation",
        stage_entry_date=today - timedelta(days=90),
        planned_stage_date=today - timedelta(days=35),
        actual_stage_date=None,
        compensation_pending_pct=10.0,
        open_dispute_count=0,
        documents_incomplete=False,
        data_source="SYNTHETIC_DEMO_DATA",
        last_updated_at=datetime.utcnow()
    )
    res = risk_engine.evaluate(c, current_date=today)
    # Overdue milestone >= 30 days must trigger high risk override (>= 70)
    assert res.risk_category == "HIGH"
    assert res.risk_score >= 70.0

def test_action_items_lifecycle():
    res_cases = client.get("/api/cases?page=1&page_size=1")
    test_case_id = res_cases.json()["items"][0]["case_id"]

    # Create action
    action_payload = {
        "case_id": test_case_id,
        "title": "Conduct Urgent District Collector Hearing",
        "description": "Objections received on draft award valuation.",
        "priority": "HIGH",
        "assigned_role": "District Collector",
        "due_date": (date.today() + timedelta(days=7)).isoformat()
    }
    create_res = client.post("/api/actions", json=action_payload)
    assert create_res.status_code == 201
    act_data = create_res.json()
    act_id = act_data["action_id"]
    assert act_data["status"] == "OPEN"

    # Update status to COMPLETED
    patch_res = client.patch(f"/api/actions/{act_id}", json={"status": "COMPLETED"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "COMPLETED"

def test_model_evaluation_empirical_metrics():
    response = client.get("/api/model/evaluation")
    assert response.status_code == 200
    data = response.json()
    baseline = data["baseline_logistic_regression"]
    comp = data["comparison_random_forest"]

    assert baseline["accuracy"] > 0.50
    assert baseline["validation_status"] == "NOT_VALIDATED_ON_REAL_DATA"
    assert baseline["is_synthetic"] is True
    assert "SYNTHETIC-DATA EVALUATION" in baseline["disclaimer"]

    # Empirical comparison model metrics
    assert comp is not None
    assert comp["accuracy"] > 0.50
    assert len(comp["confusion_matrix"]) == 2

def test_map_cases():
    response = client.get("/api/map/cases")
    assert response.status_code == 200
    data = response.json()
    assert data["mapped_count"] > 0
    assert len(data["cases"]) == data["mapped_count"]
    first = data["cases"][0]
    assert first["latitude"] is not None
    assert first["longitude"] is not None

def test_projects_summary():
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "total_cases" in data[0]

def test_csv_template_download():
    response = client.get("/api/import/template")
    assert response.status_code == 200
    assert "case_id,project_id,project_name" in response.text

def test_csv_validation_edge_cases():
    db = SessionLocal()
    try:
        # 1. Missing required column header
        bad_csv_1 = "case_id,project_name\nLA-01,Test"
        prev_1 = import_service.parse_and_validate(bad_csv_1, db)
        assert prev_1.invalid_rows_count > 0
        assert any("Missing required CSV column" in e.error for e in prev_1.errors)

        # 2. Invalid date format
        bad_csv_2 = """case_id,project_id,project_name,project_type,state,district,land_required_hectares,current_stage,stage_entry_date,planned_stage_date
LA-ERR-01,P-1,Proj,Highway,State,Dist,10.0,Survey,not-a-date,2024-05-01"""
        prev_2 = import_service.parse_and_validate(bad_csv_2, db)
        assert any(e.field == "stage_entry_date" for e in prev_2.errors)

        # 3. Duplicate Case ID within file
        bad_csv_3 = """case_id,project_id,project_name,project_type,state,district,land_required_hectares,current_stage,stage_entry_date,planned_stage_date
LA-DUP-01,P-1,Proj,Highway,State,Dist,10.0,Survey,2024-01-01,2024-05-01
LA-DUP-01,P-1,Proj,Highway,State,Dist,10.0,Survey,2024-01-01,2024-05-01"""
        prev_3 = import_service.parse_and_validate(bad_csv_3, db)
        assert any("Duplicate Case ID" in e.error for e in prev_3.errors)

        # 4. Negative land required
        bad_csv_4 = """case_id,project_id,project_name,project_type,state,district,land_required_hectares,current_stage,stage_entry_date,planned_stage_date
LA-NEG-01,P-1,Proj,Highway,State,Dist,-15.0,Survey,2024-01-01,2024-05-01"""
        prev_4 = import_service.parse_and_validate(bad_csv_4, db)
        assert any("must be greater than 0" in e.error for e in prev_4.errors)
    finally:
        db.close()

def test_demo_reset_authorization_security():
    # Calling reset without admin key must fail with 401 Unauthorized
    unauth_res = client.post("/api/demo/reset")
    assert unauth_res.status_code == 401
    assert "Unauthorized" in unauth_res.json()["detail"]

    # Calling reset with invalid key must fail with 401 Unauthorized
    fake_res = client.post("/api/demo/reset", headers={"X-Admin-Key": "wrong-key"})
    assert fake_res.status_code == 401

    # Calling with valid admin key succeeds and reseeds 250 cases
    auth_res = client.post("/api/demo/reset", headers=ADMIN_HEADER)
    assert auth_res.status_code == 200
    assert auth_res.json()["status"] == "RESET_COMPLETE"
    assert auth_res.json()["count"] == 250
