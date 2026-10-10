import pytest
import os
from pydantic import ValidationError
from app.core.config import Settings

def test_admin_reset_key_development_defaults():
    # In development, default secret is accepted
    os.environ["ENVIRONMENT"] = "development"
    os.environ["ADMIN_RESET_KEY"] = "landdelay-admin-secret-2026"
    s = Settings()
    assert s.ADMIN_RESET_KEY == "landdelay-admin-secret-2026"

def test_admin_reset_key_production_rejects_default():
    os.environ["ENVIRONMENT"] = "production"
    os.environ["ADMIN_RESET_KEY"] = "landdelay-admin-secret-2026"
    with pytest.raises(ValidationError) as exc:
        Settings()
    assert "ADMIN_RESET_KEY must be configured with a strong, non-default secret" in str(exc.value)

def test_admin_reset_key_production_rejects_weak():
    os.environ["ENVIRONMENT"] = "production"
    os.environ["ADMIN_RESET_KEY"] = "short-secret"
    with pytest.raises(ValidationError) as exc:
        Settings()
    assert "ADMIN_RESET_KEY must be at least 16 characters" in str(exc.value)

def test_admin_reset_key_production_accepts_strong_secret():
    os.environ["ENVIRONMENT"] = "production"
    os.environ["ADMIN_RESET_KEY"] = "high-entropy-production-secret-994821"
    s = Settings()
    assert s.ADMIN_RESET_KEY == "high-entropy-production-secret-994821"
    # Reset environment back to development for remaining tests
    os.environ["ENVIRONMENT"] = "development"
    os.environ["ADMIN_RESET_KEY"] = "landdelay-admin-secret-2026"
