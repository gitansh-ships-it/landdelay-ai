from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.case import ImportPreviewResponse, ImportConfirmRequest, ImportResultResponse
from app.services.import_service import import_service
from app.services.ml_service import ml_service
from app.models.case import AcquisitionCase

router = APIRouter(prefix="/import", tags=["Data Import"])

@router.get("/template")
def download_csv_template():
    content = import_service.get_template_csv()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=landdelay_import_template.csv"}
    )

@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_csv_import(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .csv files are supported")
    
    contents = (await file.read()).decode("utf-8", errors="replace")
    preview = import_service.parse_and_validate(contents, db)
    return preview

@router.post("/confirm", response_model=ImportResultResponse)
def confirm_csv_import(payload: ImportConfirmRequest, db: Session = Depends(get_db)):
    if not payload.records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No records provided for import")
    
    imported = import_service.execute_import(payload.records, payload.data_source, db)

    # Retrain ML pipeline on updated database
    all_cases = db.query(AcquisitionCase).all()
    ml_service.train_and_evaluate(all_cases)

    return ImportResultResponse(
        status="SUCCESS",
        imported_count=imported,
        data_source=payload.data_source,
        message=f"Successfully imported {imported} acquisition cases classified as {payload.data_source}."
    )
