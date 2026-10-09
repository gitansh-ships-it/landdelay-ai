import csv
import io
from datetime import datetime, date
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.case import AcquisitionCase, Milestone, AuditLog
from app.schemas.case import CSVValidationError, ImportPreviewResponse
from app.services.risk_engine import risk_engine

REQUIRED_COLUMNS = [
    "case_id", "project_id", "project_name", "project_type",
    "state", "district", "land_required_hectares", "current_stage",
    "stage_entry_date", "planned_stage_date"
]

TEMPLATE_CSV = """case_id,project_id,project_name,project_type,state,district,latitude,longitude,land_required_hectares,land_acquired_hectares,current_stage,stage_entry_date,planned_stage_date,actual_stage_date,compensation_pending_pct,open_dispute_count,documents_incomplete,data_source
LA-PUB-0101,PRJ-NHAI-001,Delhi-Mumbai Expressway Package 14,Highway,Maharashtra,Thane,19.2183,72.9781,45.5,12.0,Survey & Boundary Demarcation,2024-01-15,2024-04-15,,35.0,1,false,VERIFIED_PUBLIC_DATA
LA-PUB-0102,PRJ-DFCC-001,Eastern Dedicated Freight Corridor Ph-II,Railway,Uttar Pradesh,Varanasi,25.3176,82.9739,28.2,28.2,Possession & Physical Handover,2023-08-01,2023-11-30,2023-12-10,0.0,0,false,VERIFIED_PUBLIC_DATA
"""

class ImportService:
    @staticmethod
    def get_template_csv() -> str:
        return TEMPLATE_CSV.strip()

    @staticmethod
    def parse_and_validate(csv_content: str, db: Session) -> ImportPreviewResponse:
        errors: List[CSVValidationError] = []
        valid_records: List[Dict[str, Any]] = []
        
        reader = csv.DictReader(io.StringIO(csv_content))
        headers = [h.strip() for h in (reader.fieldnames or [])]

        # Check required columns
        for req in REQUIRED_COLUMNS:
            if req not in headers:
                errors.append(CSVValidationError(
                    row_number=0,
                    case_id=None,
                    field=req,
                    error=f"Missing required CSV column header: '{req}'"
                ))

        if errors:
            return ImportPreviewResponse(
                total_rows=0,
                valid_rows_count=0,
                invalid_rows_count=len(errors),
                errors=errors,
                sample_records=[],
                data_source_detected="UNKNOWN"
            )

        existing_case_ids = {c[0] for c in db.query(AcquisitionCase.case_id).all()}
        seen_batch_ids = set()
        row_idx = 1
        data_source_detected = "VERIFIED_PUBLIC_DATA"

        for row in reader:
            row_idx += 1
            row_has_error = False
            case_id = (row.get("case_id") or "").strip()

            if not case_id:
                errors.append(CSVValidationError(row_number=row_idx, field="case_id", error="Case ID cannot be blank"))
                continue

            if case_id in seen_batch_ids:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="case_id", error=f"Duplicate Case ID in uploaded file: '{case_id}'"))
                row_has_error = True
            seen_batch_ids.add(case_id)

            if case_id in existing_case_ids:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="case_id", error=f"Case ID already exists in registry: '{case_id}'"))
                row_has_error = True

            # Land required
            try:
                land_req = float(row.get("land_required_hectares") or 0)
                if land_req <= 0:
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="land_required_hectares", error="Land required must be greater than 0"))
                    row_has_error = True
            except ValueError:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="land_required_hectares", error="Invalid number for land_required_hectares"))
                row_has_error = True
                land_req = 0.0

            # Land acquired
            try:
                land_acq = float(row.get("land_acquired_hectares") or 0)
                if land_acq < 0:
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="land_acquired_hectares", error="Land acquired cannot be negative"))
                    row_has_error = True
            except ValueError:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="land_acquired_hectares", error="Invalid number for land_acquired_hectares"))
                row_has_error = True
                land_acq = 0.0

            # Dates
            try:
                entry_dt = datetime.strptime(row.get("stage_entry_date", "").strip(), "%Y-%m-%d").date()
            except Exception:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="stage_entry_date", error="Invalid date format for stage_entry_date. Expected YYYY-MM-DD"))
                row_has_error = True
                entry_dt = date.today()

            try:
                plan_dt = datetime.strptime(row.get("planned_stage_date", "").strip(), "%Y-%m-%d").date()
            except Exception:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="planned_stage_date", error="Invalid date format for planned_stage_date. Expected YYYY-MM-DD"))
                row_has_error = True
                plan_dt = date.today()

            act_dt = None
            if row.get("actual_stage_date", "").strip():
                try:
                    act_dt = datetime.strptime(row.get("actual_stage_date", "").strip(), "%Y-%m-%d").date()
                except Exception:
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="actual_stage_date", error="Invalid date format for actual_stage_date"))
                    row_has_error = True

            # Coordinates
            lat = None
            lng = None
            if row.get("latitude", "").strip():
                try:
                    lat = float(row.get("latitude"))
                    if not (-90.0 <= lat <= 90.0):
                        errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="latitude", error="Latitude out of bounds (-90 to 90)"))
                        row_has_error = True
                except ValueError:
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="latitude", error="Invalid number for latitude"))
                    row_has_error = True

            if row.get("longitude", "").strip():
                try:
                    lng = float(row.get("longitude"))
                    if not (-180.0 <= lng <= 180.0):
                        errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="longitude", error="Longitude out of bounds (-180 to 180)"))
                        row_has_error = True
                except ValueError:
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="longitude", error="Invalid number for longitude"))
                    row_has_error = True

            # Compensation %
            try:
                comp_pct = float(row.get("compensation_pending_pct") or 0.0)
                if not (0.0 <= comp_pct <= 100.0):
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="compensation_pending_pct", error="Percentage must be between 0 and 100"))
                    row_has_error = True
            except ValueError:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="compensation_pending_pct", error="Invalid number for compensation_pending_pct"))
                row_has_error = True
                comp_pct = 0.0

            # Disputes
            try:
                disputes = int(row.get("open_dispute_count") or 0)
                if disputes < 0:
                    errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="open_dispute_count", error="Dispute count cannot be negative"))
                    row_has_error = True
            except ValueError:
                errors.append(CSVValidationError(row_number=row_idx, case_id=case_id, field="open_dispute_count", error="Invalid integer for open_dispute_count"))
                row_has_error = True
                disputes = 0

            docs_inc = str(row.get("documents_incomplete", "false")).lower() in ["true", "1", "yes"]
            src = row.get("data_source", "").strip() or "VERIFIED_PUBLIC_DATA"
            if src in ["VERIFIED_PUBLIC_DATA", "SYNTHETIC_DEMO_DATA"]:
                data_source_detected = src

            if not row_has_error:
                valid_records.append({
                    "case_id": case_id,
                    "project_id": row.get("project_id", "").strip(),
                    "project_name": row.get("project_name", "").strip(),
                    "project_type": row.get("project_type", "").strip(),
                    "state": row.get("state", "").strip(),
                    "district": row.get("district", "").strip(),
                    "latitude": lat,
                    "longitude": lng,
                    "land_required_hectares": land_req,
                    "land_acquired_hectares": land_acq,
                    "current_stage": row.get("current_stage", "").strip(),
                    "stage_entry_date": entry_dt.isoformat(),
                    "planned_stage_date": plan_dt.isoformat(),
                    "actual_stage_date": act_dt.isoformat() if act_dt else None,
                    "compensation_pending_pct": comp_pct,
                    "open_dispute_count": disputes,
                    "documents_incomplete": docs_inc,
                    "data_source": src
                })

        return ImportPreviewResponse(
            total_rows=row_idx - 1,
            valid_rows_count=len(valid_records),
            invalid_rows_count=len(errors),
            errors=errors,
            sample_records=valid_records[:5],
            data_source_detected=data_source_detected
        )

    @staticmethod
    def execute_import(records: List[Dict[str, Any]], data_source: str, db: Session) -> int:
        imported_count = 0
        today = date.today()

        for r in records:
            entry_dt = datetime.strptime(r["stage_entry_date"], "%Y-%m-%d").date()
            plan_dt = datetime.strptime(r["planned_stage_date"], "%Y-%m-%d").date()
            act_dt = datetime.strptime(r["actual_stage_date"], "%Y-%m-%d").date() if r.get("actual_stage_date") else None
            
            is_delayed = False
            delay_days = 0
            if act_dt:
                is_delayed = act_dt > plan_dt
                delay_days = max(0, (act_dt - plan_dt).days)
            elif plan_dt < today:
                is_delayed = True
                delay_days = (today - plan_dt).days

            verification_status = "VERIFIED" if data_source == "VERIFIED_PUBLIC_DATA" else "DEMO"

            case = AcquisitionCase(
                case_id=r["case_id"],
                project_id=r["project_id"],
                project_name=r["project_name"],
                project_type=r["project_type"],
                state=r["state"],
                district=r["district"],
                latitude=r.get("latitude"),
                longitude=r.get("longitude"),
                land_required_hectares=r["land_required_hectares"],
                land_acquired_hectares=r.get("land_acquired_hectares", 0.0),
                current_stage=r["current_stage"],
                stage_entry_date=entry_dt,
                planned_stage_date=plan_dt,
                actual_stage_date=act_dt,
                compensation_pending_pct=r.get("compensation_pending_pct", 0.0),
                open_dispute_count=r.get("open_dispute_count", 0),
                documents_incomplete=r.get("documents_incomplete", False),
                delay_days=delay_days,
                delayed=is_delayed,
                data_source=data_source,
                verification_status=verification_status,
                status="COMPLETED" if act_dt else ("STALLED" if delay_days > 90 else "IN_PROGRESS"),
                last_updated_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )

            # Auto-generate standard milestone for the current stage
            ms = Milestone(
                case_id=case.case_id,
                milestone_name=f"{case.current_stage} Completion",
                stage_name=case.current_stage,
                planned_date=plan_dt,
                actual_date=act_dt,
                status="COMPLETED" if act_dt else ("OVERDUE" if is_delayed else "IN_PROGRESS"),
                sequence_order=1,
                days_overdue=delay_days
            )
            case.milestones = [ms]

            # Evaluate transparent risk score
            risk_res = risk_engine.evaluate(case)
            case.risk_score = risk_res.risk_score
            case.risk_category = risk_res.risk_category

            audit = AuditLog(
                case_id=case.case_id,
                action_type="CSV_IMPORT",
                details=f"Case imported from CSV dataset labeled {data_source}.",
                timestamp=datetime.utcnow()
            )
            case.audit_logs = [audit]

            db.add(case)
            imported_count += 1

        db.commit()
        return imported_count

import_service = ImportService()
