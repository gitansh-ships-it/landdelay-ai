import pytest
from app.db.database import SessionLocal
from app.services.import_service import import_service
from app.models.case import AcquisitionCase

def generate_csv_rows(count: int, start_idx: int = 1000) -> str:
    header = "case_id,project_id,project_name,project_type,state,district,land_required_hectares,current_stage,stage_entry_date,planned_stage_date\n"
    lines = [header]
    for i in range(count):
        lines.append(f"LA-BATCH-{start_idx + i},PRJ-B-{i},Batch Project {i},Highway,Maharashtra,Thane,15.5,Survey & Boundary Demarcation,2024-01-01,2024-06-01\n")
    return "".join(lines)

def test_csv_import_1_record():
    db = SessionLocal()
    try:
        csv_1 = generate_csv_rows(1, start_idx=101)
        res = import_service.parse_and_validate(csv_1, db)
        assert res.total_rows == 1
        assert res.valid_rows_count == 1
        assert res.invalid_rows_count == 0
        assert len(res.valid_records) == 1
        assert res.valid_records[0]["case_id"] == "LA-BATCH-101"
    finally:
        db.close()

def test_csv_import_5_records():
    db = SessionLocal()
    try:
        csv_5 = generate_csv_rows(5, start_idx=201)
        res = import_service.parse_and_validate(csv_5, db)
        assert res.total_rows == 5
        assert res.valid_rows_count == 5
        assert len(res.valid_records) == 5
    finally:
        db.close()

def test_csv_import_6_records_full_batch_preserved():
    db = SessionLocal()
    try:
        csv_6 = generate_csv_rows(6, start_idx=301)
        res = import_service.parse_and_validate(csv_6, db)
        assert res.total_rows == 6
        assert res.valid_rows_count == 6
        # Crucial check: valid_records contains all 6, not capped to sample 5
        assert len(res.valid_records) == 6
        assert len(res.sample_records) == 5
    finally:
        db.close()

def test_csv_import_100_records():
    db = SessionLocal()
    try:
        csv_100 = generate_csv_rows(100, start_idx=401)
        res = import_service.parse_and_validate(csv_100, db)
        assert res.total_rows == 100
        assert res.valid_rows_count == 100
        assert len(res.valid_records) == 100
        assert len(res.sample_records) == 5
    finally:
        db.close()

def test_csv_import_atomicity_and_duplicate_rejection():
    db = SessionLocal()
    try:
        # 1. Execute an actual import of 2 records
        csv_batch = generate_csv_rows(2, start_idx=901)
        parsed = import_service.parse_and_validate(csv_batch, db)
        imported_count = import_service.execute_import(parsed.valid_records, "VERIFIED_PUBLIC_DATA", db)
        assert imported_count == 2

        # Verify records exist in DB
        case_1 = db.query(AcquisitionCase).filter_by(case_id="LA-BATCH-901").first()
        case_2 = db.query(AcquisitionCase).filter_by(case_id="LA-BATCH-902").first()
        assert case_1 is not None
        assert case_2 is not None

        # 2. Re-importing same file must fail validation due to existing DB records
        re_parsed = import_service.parse_and_validate(csv_batch, db)
        assert re_parsed.invalid_rows_count == 2
        assert any("already exists in registry" in err.error for err in re_parsed.errors)

        # Clean up test records
        db.delete(case_1)
        db.delete(case_2)
        db.commit()
    finally:
        db.close()
