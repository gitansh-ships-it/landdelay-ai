import os
from pydantic_settings import BaseSettings

def get_normalized_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", "sqlite:///./landdelay.db")
    # Render and Heroku PostgreSQL URLs commonly begin with postgres://
    # SQLAlchemy requires postgresql:// or postgresql+psycopg2://
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)
    return raw_url

class Settings(BaseSettings):
    PROJECT_NAME: str = "LandDelay AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Networking & Port binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database connection
    DATABASE_URL: str = get_normalized_database_url()

    # CORS configuration - comma-separated origins, or '*'
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Security: In production, supply a random secret via ADMIN_RESET_KEY environment variable
    ADMIN_RESET_KEY: str = os.getenv("ADMIN_RESET_KEY", "landdelay-admin-secret-2026")

    # Auto-seed controls on startup
    AUTO_SEED_DEMO_DATA: bool = os.getenv("AUTO_SEED_DEMO_DATA", "true").lower() in ("true", "1", "yes")

    # Risk Classification Thresholds
    RISK_THRESHOLD_HIGH: float = 70.0
    RISK_THRESHOLD_MEDIUM: float = 40.0
    
    # Staleness alert in days
    STALENESS_DAYS: int = 45
    
    # Standard benchmark days per acquisition stage
    STAGE_BENCHMARKS: dict[str, int] = {
        "Preliminary Notification": 60,
        "Survey & Boundary Demarcation": 90,
        "Public Hearing & Objections": 60,
        "Declaration & Final Scheme": 60,
        "Valuation & Award Determination": 90,
        "Compensation Disbursement": 60,
        "Possession & Physical Handover": 45
    }

    # Default rule engine weights (sum to 100 max)
    RULE_WEIGHT_OVERDUE_MILESTONE: float = 35.0
    RULE_WEIGHT_STAGE_EXCEEDED: float = 20.0
    RULE_WEIGHT_INCOMPLETE_DOCS: float = 15.0
    RULE_WEIGHT_HIGH_COMP_PENDING: float = 15.0
    RULE_WEIGHT_UNRESOLVED_DISPUTES: float = 10.0
    RULE_WEIGHT_STALE_RECORD: float = 5.0

    class Config:
        case_sensitive = True

settings = Settings()
