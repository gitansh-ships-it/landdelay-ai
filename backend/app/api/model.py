from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.case import AcquisitionCase
from app.schemas.case import ModelEvaluationResponse, PredictionRequest, PredictionResponse
from app.services.ml_service import ml_service

router = APIRouter(prefix="", tags=["Machine Learning"])

@router.get("/model/evaluation", response_model=ModelEvaluationResponse)
def get_model_evaluation(db: Session = Depends(get_db)):
    if ml_service.evaluation_results is None:
        all_cases = db.query(AcquisitionCase).all()
        res = ml_service.train_and_evaluate(all_cases)
        if not res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insufficient records in database for supervised model training (minimum 20 balanced records required). Please seed demo data or import cases."
            )
        return res
    
    return ml_service.evaluation_results

@router.post("/predict", response_model=PredictionResponse)
def predict_case_delay(payload: PredictionRequest, db: Session = Depends(get_db)):
    # If case_id provided, ensure model is ready
    if not ml_service.is_trained:
        all_cases = db.query(AcquisitionCase).all()
        if len(all_cases) >= 20:
            ml_service.train_and_evaluate(all_cases)

    result = ml_service.predict_instance(payload.model_dump())
    return result
