# LandDelay AI — Data Provenance & Ingestion Policy

## 1. Classification Categories

LandDelay AI enforces an explicit, immutable distinction between two categories of records:

1. **`VERIFIED_PUBLIC_DATA`**
   - Records sourced from public government portals, official state gazettes, project progress dashboards (e.g. PM Gati Shakti, Ministry of Road Transport and Highways, NHAI, DFCCIL, Indian Railways).
   - Coordinates (`latitude`, `longitude`) are only recorded when published in official gazette notifications.
   - **Crucial Rule:** If GPS coordinates are missing from public records, they remain `null`. The system **never fabricates or imputes spatial coordinates** for verified records. Missing coordinates are explicitly excluded from geographic maps and reported in `unmapped_count`.

2. **`SYNTHETIC_DEMO_DATA`**
   - Generated deterministically by the seed engine (`scripts/seed_demo.py` / `POST /api/demo/seed`) using fixed random seed `42`.
   - Used exclusively for offline demonstrations, load testing, and interface verification.
   - Every synthetic parcel is explicitly tagged in the database with `data_source = "SYNTHETIC_DEMO_DATA"` and `verification_status = "DEMO"`.
   - Synthetic records are never represented to stakeholders as authentic government operations.

## 2. Ingestion Validation Matrix

Uploaded CSV files undergo transactional pre-import auditing:
- **Case ID Uniqueness:** Duplicate identifiers in the file or against the existing database are flagged as blocking errors.
- **Statutory Required Headers:** `case_id`, `project_name`, `project_type`, `state`, `district`, `land_required_hectares`, `current_stage`, `stage_entry_date`, `planned_stage_date`.
- **Value Bounds:**
  - `land_required_hectares` must be > 0.
  - `land_acquired_hectares` >= 0 and <= `land_required_hectares`.
  - `compensation_pending_pct` strictly within [0.0, 100.0].
  - `open_dispute_count` >= 0.
  - Coordinates (if provided) must satisfy latitude [-90, 90] and longitude [-180, 180].

## 3. Audit Logging
Every record change, status transition, parameter edit, or CSV ingestion creates an immutable entry in the `audit_logs` database table.
