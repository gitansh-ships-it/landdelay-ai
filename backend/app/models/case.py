from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class AcquisitionCase(Base):
    __tablename__ = "acquisition_cases"

    case_id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), index=True, nullable=False)
    project_name = Column(String(200), index=True, nullable=False)
    project_type = Column(String(100), index=True, nullable=False)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    
    # Real geo coordinates (nullable, never fabricated for public data)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Land metric
    land_required_hectares = Column(Float, default=0.0, nullable=False)
    land_acquired_hectares = Column(Float, default=0.0, nullable=False)
    
    # Acquisition lifecycle
    current_stage = Column(String(100), nullable=False)
    stage_entry_date = Column(Date, nullable=False)
    planned_stage_date = Column(Date, nullable=False)
    actual_stage_date = Column(Date, nullable=True)
    
    # Risk factors
    compensation_pending_pct = Column(Float, default=0.0, nullable=True)
    open_dispute_count = Column(Integer, default=0, nullable=False)
    documents_incomplete = Column(Boolean, default=False, nullable=False)
    
    # Outcome tracking
    delay_days = Column(Integer, default=0, nullable=False)
    delayed = Column(Boolean, default=False, nullable=False)
    
    # Provenance
    data_source = Column(String(50), default="SYNTHETIC_DEMO_DATA", nullable=False)
    verification_status = Column(String(50), default="UNVERIFIED", nullable=False) # UNVERIFIED, VERIFIED, DEMO
    
    # Calculated risk
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_category = Column(String(20), default="LOW", nullable=False) # LOW, MEDIUM, HIGH
    ml_delay_probability = Column(Float, nullable=True)
    
    status = Column(String(50), default="IN_PROGRESS", nullable=False) # IN_PROGRESS, COMPLETED, STALLED
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    milestones = relationship("Milestone", back_populates="case", cascade="all, delete-orphan", order_by="Milestone.sequence_order")
    actions = relationship("ActionItem", back_populates="case", cascade="all, delete-orphan", order_by="desc(ActionItem.created_at)")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan", order_by="desc(AuditLog.timestamp)")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("acquisition_cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_name = Column(String(150), nullable=False)
    stage_name = Column(String(100), nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_date = Column(Date, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, IN_PROGRESS, COMPLETED, OVERDUE
    sequence_order = Column(Integer, default=1, nullable=False)
    days_overdue = Column(Integer, default=0, nullable=False)

    case = relationship("AcquisitionCase", back_populates="milestones")


class ActionItem(Base):
    __tablename__ = "action_items"

    action_id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("acquisition_cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM", nullable=False) # HIGH, MEDIUM, LOW
    assigned_role = Column(String(100), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="OPEN", nullable=False) # OPEN, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    case = relationship("AcquisitionCase", back_populates="actions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("acquisition_cases.case_id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("AcquisitionCase", back_populates="audit_logs")
