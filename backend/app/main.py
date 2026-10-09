import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.api import dashboard, cases, actions, imports, demo, model, map, projects
from app.services.demo_service import generate_synthetic_dataset
from app.models.case import AcquisitionCase

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB schema (creates tables if they do not exist)
    Base.metadata.create_all(bind=engine)
    
    # 2. Check auto-seed configuration
    # Only seed if table is empty AND AUTO_SEED_DEMO_DATA is explicitly enabled
    if settings.AUTO_SEED_DEMO_DATA:
        db = SessionLocal()
        try:
            case_count = db.query(AcquisitionCase).count()
            if case_count == 0:
                print("[LandDelay AI] Initializing empty database with 250 deterministic synthetic cases...")
                generate_synthetic_dataset(db, count=250)
                print("[LandDelay AI] Database successfully seeded.")
            else:
                print(f"[LandDelay AI] Existing database contains {case_count} cases. Preserving records across restart.")
        except Exception as e:
            print(f"[LandDelay AI] Database seed check error: {e}")
        finally:
            db.close()
    else:
        print("[LandDelay AI] AUTO_SEED_DEMO_DATA is disabled. Skipping automatic seeding.")

    yield

app = FastAPI(
    title="LandDelay AI API",
    description="Predictive Analytics & Decision Support for Early Detection of Land Acquisition Delays",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS dynamically from environment variable
cors_origins = settings.cors_origins_list
allow_all_origins = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not allow_all_origins, # Credentials must be False if origin is '*' in CORS spec
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Readiness probe for deployment (e.g. Render, Kubernetes, Docker)
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "type": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
            "status": db_status
        },
        "mode": "DECISION_SUPPORT_SYSTEM"
    }

# Include API Routers
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(cases.router, prefix=settings.API_V1_PREFIX)
app.include_router(actions.router, prefix=settings.API_V1_PREFIX)
app.include_router(imports.router, prefix=settings.API_V1_PREFIX)
app.include_router(demo.router, prefix=settings.API_V1_PREFIX)
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(map.router, prefix=settings.API_V1_PREFIX)
app.include_router(model.router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
