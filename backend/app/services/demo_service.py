import random
from datetime import date, datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.case import AcquisitionCase, Milestone, ActionItem, AuditLog
from app.services.risk_engine import risk_engine
from app.services.ml_service import ml_service

# Authentic infrastructure corridors across India
PROJECTS = [
    {"id": "PRJ-NHAI-001", "name": "Delhi-Mumbai Expressway Package 14", "type": "Highway"},
    {"id": "PRJ-NHAI-002", "name": "Bengaluru-Chennai Expressway Sec 4", "type": "Highway"},
    {"id": "PRJ-NHAI-003", "name": "Varanasi-Kolkata Economic Corridor", "type": "Highway"},
    {"id": "PRJ-DFCC-001", "name": "Eastern Dedicated Freight Corridor Ph-II", "type": "Railway"},
    {"id": "PRJ-DFCC-002", "name": "Western DFC Rewari-Vadodara Link", "type": "Railway"},
    {"id": "PRJ-METRO-001", "name": "Mumbai Metro Line 4 Wadala-Kasarvadavali", "type": "Metro Rail"},
    {"id": "PRJ-METRO-002", "name": "Bengaluru Metro Phase 2A Outer Ring", "type": "Metro Rail"},
    {"id": "PRJ-METRO-003", "name": "Patna Metro Phase 1 Corridor", "type": "Metro Rail"},
    {"id": "PRJ-SOLAR-001", "name": "Bhadla Solar Park Extension Phase IV", "type": "Power & Energy"},
    {"id": "PRJ-SOLAR-002", "name": "Pavagada Mega Solar Power Complex", "type": "Power & Energy"},
    {"id": "PRJ-AIRPORT-001", "name": "Noida International Airport Jewar Ph-2", "type": "Airport"},
    {"id": "PRJ-PORT-001", "name": "Vadhavan Major Port Rail Connectivity", "type": "Port Link"},
    {"id": "PRJ-IND-001", "name": "Delhi-Nagpur Industrial Corridor Node", "type": "Industrial Corridor"}
]

DISTRICTS = [
    {"state": "Maharashtra", "district": "Thane", "lat": 19.2183, "lng": 72.9781},
    {"state": "Maharashtra", "district": "Palghar", "lat": 19.6967, "lng": 72.7655},
    {"state": "Maharashtra", "district": "Pune", "lat": 18.5204, "lng": 73.8567},
    {"state": "Uttar Pradesh", "district": "Gautam Buddha Nagar", "lat": 28.3588, "lng": 77.5508},
    {"state": "Uttar Pradesh", "district": "Varanasi", "lat": 25.3176, "lng": 82.9739},
    {"state": "Uttar Pradesh", "district": "Mathura", "lat": 27.4924, "lng": 77.6737},
    {"state": "Karnataka", "district": "Bengaluru Urban", "lat": 12.9716, "lng": 77.5946},
    {"state": "Karnataka", "district": "Tumakuru", "lat": 13.3379, "lng": 77.1010},
    {"state": "Karnataka", "district": "Kolar", "lat": 13.1367, "lng": 78.1291},
    {"state": "Gujarat", "district": "Vadodara", "lat": 22.3072, "lng": 73.1812},
    {"state": "Gujarat", "district": "Surat", "lat": 21.1702, "lng": 72.8311},
    {"state": "Rajasthan", "district": "Jodhpur", "lat": 26.2389, "lng": 73.0243},
    {"state": "Rajasthan", "district": "Alwar", "lat": 27.5530, "lng": 76.6346},
    {"state": "Tamil Nadu", "district": "Kanchipuram", "lat": 12.8342, "lng": 79.7036},
    {"state": "Tamil Nadu", "district": "Vellore", "lat": 12.9165, "lng": 79.1325},
    {"state": "Haryana", "district": "Gurugram", "lat": 28.4595, "lng": 77.0266},
    {"state": "Haryana", "district": "Rewari", "lat": 28.1834, "lng": 76.6186},
    {"state": "West Bengal", "district": "Howrah", "lat": 22.5958, "lng": 88.2636},
    {"state": "Bihar", "district": "Patna", "lat": 25.5941, "lng": 85.1376},
]

STAGES = [
    "Preliminary Notification",
    "Survey & Boundary Demarcation",
    "Public Hearing & Objections",
    "Declaration & Final Scheme",
    "Valuation & Award Determination",
    "Compensation Disbursement",
    "Possession & Physical Handover"
]

def generate_synthetic_dataset(db: Session, count: int = 250) -> int:
    """
    Generates deterministic, internally consistent synthetic cases.
    Seed: 42 for absolute reproducibility.
    """
    random.seed(42)
    today = date.today()

    cases_to_add: List[AcquisitionCase] = []
    actions_to_add: List[ActionItem] = []
    audits_to_add: List[AuditLog] = []

    for i in range(1, count + 1):
        case_id = f"LA-SYN-{i:04d}"
        proj = random.choice(PROJECTS)
        loc = random.choice(DISTRICTS)
        # Add slight jitter to coordinates so points in same district don't overlap exactly
        jitter_lat = round(loc["lat"] + random.uniform(-0.12, 0.12), 5)
        jitter_lng = round(loc["lng"] + random.uniform(-0.12, 0.12), 5)

        # Stage distribution: mix of early, mid, and final stages
        stage_idx = random.choices([0, 1, 2, 3, 4, 5, 6], weights=[15, 20, 20, 18, 12, 10, 5])[0]
        current_stage = STAGES[stage_idx]

        # Land requirements (hectares)
        land_required = round(random.uniform(2.5, 85.0), 2)
        progress_factor = stage_idx / 6.0
        land_acquired = round(min(land_required, land_required * progress_factor * random.uniform(0.6, 1.05)), 2)

        # Timeline generation
        stage_entry_days_ago = random.randint(15, 180)
        stage_entry_date = today - timedelta(days=stage_entry_days_ago)

        # Realistic planned stage duration (usually 45 to 90 days)
        planned_duration = random.choice([45, 60, 90])
        planned_stage_date = stage_entry_date + timedelta(days=planned_duration)

        # Introduce realistic risk conditions
        is_overdue = planned_stage_date < today
        has_doc_issue = random.random() < 0.28
        open_disputes = random.choices([0, 1, 2, 3, 4], weights=[60, 22, 11, 5, 2])[0]
        comp_pending = round(random.uniform(10.0, 85.0), 1) if stage_idx >= 3 else round(random.uniform(0.0, 15.0), 1)

        # Realistic data-generating process (DGP) with stochastic administrative noise
        # Prevents trivial rule-based target leakage and ensures realistic evaluation difficulty
        is_completed = stage_idx == 6 and random.random() < 0.7
        actual_stage_date = None
        if is_completed:
            actual_stage_date = planned_stage_date + timedelta(days=random.randint(-15, 20))
            is_delayed = actual_stage_date > planned_stage_date
            delay_days = max(0, (actual_stage_date - planned_stage_date).days)
            case_status = "COMPLETED"
        else:
            # Latent delay factor
            z = -0.3
            if is_overdue:
                z += 1.1
            if open_disputes > 0:
                z += 0.4 * open_disputes
            if has_doc_issue:
                z += 0.65
            if comp_pending > 30:
                z += 0.015 * (comp_pending - 30)
            if land_required > 40:
                z += 0.25
            
            # Stochastic real-world noise (unobserved administrative friction)
            stochastic_noise = random.gauss(0, 0.45)
            prob_delay = 1.0 / (1.0 + (2.71828 ** -(z + stochastic_noise)))
            is_delayed = prob_delay >= 0.50
            delay_days = max(0, (today - planned_stage_date).days) if is_overdue else (random.randint(5, 30) if is_delayed else 0)
            case_status = "STALLED" if (delay_days > 90 or open_disputes >= 3) else "IN_PROGRESS"

        # Last updated timestamp
        last_updated_days_ago = random.randint(1, 60)
        last_updated = datetime.combine(today - timedelta(days=last_updated_days_ago), datetime.min.time())

        case = AcquisitionCase(
            case_id=case_id,
            project_id=proj["id"],
            project_name=proj["name"],
            project_type=proj["type"],
            state=loc["state"],
            district=loc["district"],
            latitude=jitter_lat,
            longitude=jitter_lng,
            land_required_hectares=land_required,
            land_acquired_hectares=land_acquired,
            current_stage=current_stage,
            stage_entry_date=stage_entry_date,
            planned_stage_date=planned_stage_date,
            actual_stage_date=actual_stage_date,
            compensation_pending_pct=comp_pending,
            open_dispute_count=open_disputes,
            documents_incomplete=has_doc_issue,
            delay_days=delay_days,
            delayed=is_delayed,
            data_source="SYNTHETIC_DEMO_DATA",
            verification_status="DEMO",
            status=case_status,
            last_updated_at=last_updated,
            created_at=datetime.combine(stage_entry_date, datetime.min.time())
        )

        # Generate standard sequential milestones
        milestones = []
        cum_date = stage_entry_date - timedelta(days=stage_idx * 45)
        for s_idx, stg_name in enumerate(STAGES):
            ms_planned = cum_date + timedelta(days=45)
            cum_date = ms_planned
            
            if s_idx < stage_idx:
                ms_status = "COMPLETED"
                ms_actual = ms_planned + timedelta(days=random.randint(-10, 15))
                ms_overdue = 0
            elif s_idx == stage_idx:
                if is_completed:
                    ms_status = "COMPLETED"
                    ms_actual = actual_stage_date
                    ms_overdue = delay_days
                elif ms_planned < today:
                    ms_status = "OVERDUE"
                    ms_actual = None
                    ms_overdue = (today - ms_planned).days
                else:
                    ms_status = "IN_PROGRESS"
                    ms_actual = None
                    ms_overdue = 0
            else:
                ms_status = "PENDING"
                ms_actual = None
                ms_overdue = 0

            ms = Milestone(
                case_id=case_id,
                milestone_name=f"{stg_name} Compliance Order",
                stage_name=stg_name,
                planned_date=ms_planned,
                actual_date=ms_actual,
                status=ms_status,
                sequence_order=s_idx + 1,
                days_overdue=ms_overdue
            )
            milestones.append(ms)

        case.milestones = milestones

        # Evaluate initial transparent risk score
        risk_res = risk_engine.evaluate(case, current_date=today)
        case.risk_score = risk_res.risk_score
        case.risk_category = risk_res.risk_category

        # Add initial Action if HIGH risk
        if case.risk_category == "HIGH" and random.random() < 0.75:
            rec = risk_res.recommended_actions[0] if risk_res.recommended_actions else {
                "title": "Immediate Joint Collector Review",
                "reason": "Milestone critically delayed.",
                "priority": "HIGH",
                "assigned_role": "District Collector"
            }
            action_item = ActionItem(
                action_id=f"ACT-{case_id}",
                case_id=case_id,
                title=rec["title"],
                description=f"Action automatically suggested by LandDelay AI: {rec['reason']}",
                priority=rec["priority"],
                assigned_role=rec["assigned_role"],
                due_date=today + timedelta(days=14),
                status=random.choice(["OPEN", "OPEN", "IN_PROGRESS"]),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
            )
            actions_to_add.append(action_item)

        # Audit log
        audits_to_add.append(AuditLog(
            case_id=case_id,
            action_type="INITIAL_INGESTION",
            details="Synthetic demonstration case initialized with verified statutory parameters.",
            timestamp=datetime.utcnow()
        ))

        cases_to_add.append(case)

    # Database transaction
    db.add_all(cases_to_add)
    db.flush()
    db.add_all(actions_to_add)
    db.add_all(audits_to_add)
    db.commit()

    # Train initial ML service on the demo data
    ml_service.train_and_evaluate(cases_to_add)

    return len(cases_to_add)

def reset_and_reseed_database(db: Session) -> int:
    """Safely clear and deterministically reseed demo dataset."""
    db.query(ActionItem).delete()
    db.query(Milestone).delete()
    db.query(AuditLog).delete()
    db.query(AcquisitionCase).delete()
    db.commit()
    return generate_synthetic_dataset(db, count=250)
