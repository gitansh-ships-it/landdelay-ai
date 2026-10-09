from datetime import date, datetime
from typing import List, Dict, Any
from app.models.case import AcquisitionCase
from app.core.config import settings
from app.schemas.case import RiskAssessment, ContributingFactor

class TransparentRiskEngine:
    """
    Deterministic rules-based risk engine for Land Acquisition Delay detection.
    Guarantees transparency, traceability, and zero black-box decisions.
    All scores are labelled 'RULE_BASED_SCORE'.
    """

    @staticmethod
    def evaluate(case: AcquisitionCase, current_date: date = None) -> RiskAssessment:
        if current_date is None:
            current_date = date.today()

        total_score = 0.0
        warnings: List[str] = []
        factors: List[ContributingFactor] = []
        recommended_actions: List[Dict[str, str]] = []

        # 1. Milestone Deadline Overdue Check
        has_overdue_milestone = False
        max_days_overdue = 0
        if case.milestones:
            for ms in case.milestones:
                if ms.status in ["OVERDUE", "PENDING", "IN_PROGRESS"] and ms.planned_date < current_date and not ms.actual_date:
                    days_over = (current_date - ms.planned_date).days
                    if days_over > max_days_overdue:
                        max_days_overdue = days_over
                    has_overdue_milestone = True
        elif case.planned_stage_date < current_date and not case.actual_stage_date:
            days_over = (current_date - case.planned_stage_date).days
            if days_over > 0:
                has_overdue_milestone = True
                max_days_overdue = days_over

        if has_overdue_milestone:
            overdue_weight = settings.RULE_WEIGHT_OVERDUE_MILESTONE
            # Scale if severely overdue (>60 days)
            if max_days_overdue > 60:
                overdue_weight = min(40.0, overdue_weight * 1.15)
            total_score += overdue_weight
            warning_msg = f"Critical milestone is overdue by {max_days_overdue} days beyond planned deadline."
            warnings.append(warning_msg)
            factors.append(ContributingFactor(
                factor="Milestone Schedule Slippage",
                impact="HIGH",
                weight_score=round(overdue_weight, 1),
                description=f"Planned stage completion date elapsed without recorded completion ({max_days_overdue} days late)."
            ))
            recommended_actions.append({
                "title": "Convene Joint Milestone Review Meeting",
                "reason": f"Stage milestone overdue by {max_days_overdue} days.",
                "priority": "HIGH",
                "assigned_role": "Project Monitoring Officer"
            })

        # 2. Stage Duration Exceeded against Benchmark
        days_in_stage = (current_date - case.stage_entry_date).days if case.stage_entry_date else 0
        benchmark_days = settings.STAGE_BENCHMARKS.get(case.current_stage, 60)
        if days_in_stage > benchmark_days:
            exceeded_ratio = min(2.0, days_in_stage / benchmark_days)
            stage_weight = settings.RULE_WEIGHT_STAGE_EXCEEDED * (exceeded_ratio - 1.0)
            stage_weight = min(settings.RULE_WEIGHT_STAGE_EXCEEDED, max(5.0, stage_weight))
            total_score += stage_weight
            warning_msg = f"Duration in '{case.current_stage}' ({days_in_stage} days) exceeds statutory benchmark of {benchmark_days} days."
            warnings.append(warning_msg)
            factors.append(ContributingFactor(
                factor="Excessive Stage Duration",
                impact="MEDIUM" if days_in_stage < benchmark_days * 1.5 else "HIGH",
                weight_score=round(stage_weight, 1),
                description=f"Case has remained in {case.current_stage} for {days_in_stage} days (benchmark: {benchmark_days}d)."
            ))
            recommended_actions.append({
                "title": f"Expedite Stage Workflow: {case.current_stage}",
                "reason": f"Case has exceeded benchmark duration by {days_in_stage - benchmark_days} days.",
                "priority": "MEDIUM",
                "assigned_role": "Land Acquisition Officer"
            })

        # 3. Incomplete Documentation
        if case.documents_incomplete:
            doc_weight = settings.RULE_WEIGHT_INCOMPLETE_DOCS
            total_score += doc_weight
            warnings.append("Mandatory statutory documentation or title clearance files are missing or incomplete.")
            factors.append(ContributingFactor(
                factor="Documentation Incomplete",
                impact="MEDIUM",
                weight_score=round(doc_weight, 1),
                description="Revenue survey records, revenue gazette notification, or title verification dossiers remain uncertified."
            ))
            recommended_actions.append({
                "title": "Audit Incomplete Title Records & Gazette Dossier",
                "reason": "Missing statutory records block award declaration.",
                "priority": "HIGH",
                "assigned_role": "Land Acquisition Officer"
            })

        # 4. Compensation Pending Percentage
        comp_pct = case.compensation_pending_pct or 0.0
        if comp_pct > 30.0:
            comp_weight = settings.RULE_WEIGHT_HIGH_COMP_PENDING * (comp_pct / 100.0)
            total_score += comp_weight
            warnings.append(f"Significant compensation pending disbursement: {comp_pct:.1f}% unreleased.")
            factors.append(ContributingFactor(
                factor="Compensation Disbursement Backlog",
                impact="HIGH" if comp_pct > 60 else "MEDIUM",
                weight_score=round(comp_weight, 1),
                description=f"{comp_pct:.1f}% of determined compensation remains pending release to landowners."
            ))
            recommended_actions.append({
                "title": "Verify Treasury Escrow & Beneficiary Bank Mandates",
                "reason": f"{comp_pct:.1f}% compensation undisbursed, risking litigation injunctions.",
                "priority": "HIGH" if comp_pct > 60 else "MEDIUM",
                "assigned_role": "Valuation Officer"
            })

        # 5. Open Land Disputes / Court Litigations
        if case.open_dispute_count > 0:
            dispute_weight = min(settings.RULE_WEIGHT_UNRESOLVED_DISPUTES * 1.5, case.open_dispute_count * 5.0)
            total_score += dispute_weight
            warnings.append(f"{case.open_dispute_count} active dispute(s) or court petition(s) recorded on parcel.")
            factors.append(ContributingFactor(
                factor="Active Land Disputes / Injunction Petitions",
                impact="HIGH" if case.open_dispute_count >= 2 else "MEDIUM",
                weight_score=round(dispute_weight, 1),
                description=f"There are {case.open_dispute_count} open legal disputes or boundary contestations recorded."
            ))
            recommended_actions.append({
                "title": "Initiate Sub-Divisional Magistrate / Lok Adalat Conciliation",
                "reason": f"{case.open_dispute_count} active disputes impeding boundary demarcation.",
                "priority": "HIGH",
                "assigned_role": "Legal Counsel"
            })

        # 6. Record Staleness
        last_updated = case.last_updated_at.date() if isinstance(case.last_updated_at, datetime) else current_date
        stale_days = (current_date - last_updated).days
        if stale_days > settings.STALENESS_DAYS:
            stale_weight = settings.RULE_WEIGHT_STALE_RECORD
            total_score += stale_weight
            warnings.append(f"Monitoring record is stale: no progress verified for {stale_days} days.")
            factors.append(ContributingFactor(
                factor="Data Freshness Lag",
                impact="LOW",
                weight_score=round(stale_weight, 1),
                description=f"No field inspection or registry update posted in {stale_days} days (threshold {settings.STALENESS_DAYS}d)."
            ))
            recommended_actions.append({
                "title": "Dispatch Field Verification Team for Physical Inspection",
                "reason": f"Monitoring data has not been updated for {stale_days} days.",
                "priority": "LOW",
                "assigned_role": "District Collector"
            })

        # Safe bounding: 0.0 to 100.0
        final_score = min(100.0, max(0.0, total_score))

        # Critical Overdue Rule: if a milestone is overdue by >= 30 days, ensure score >= 70 (HIGH)
        if max_days_overdue >= 30 and final_score < settings.RISK_THRESHOLD_HIGH:
            final_score = settings.RISK_THRESHOLD_HIGH
            if "Critical milestone is overdue by >= 30 days - automatic high risk override applied." not in warnings:
                warnings.append("Schedule milestone overdue by >= 30 days - administrative escalation triggered.")

        # Determine Risk Category
        if final_score >= settings.RISK_THRESHOLD_HIGH:
            risk_category = "HIGH"
        elif final_score >= settings.RISK_THRESHOLD_MEDIUM:
            risk_category = "MEDIUM"
        else:
            risk_category = "LOW"

        # If clean
        if not warnings:
            factors.append(ContributingFactor(
                factor="On-Schedule Progress",
                impact="LOW",
                weight_score=0.0,
                description="Case milestones, documentation, and compensation disbursement are tracking within prescribed statutory timelines."
            ))

        return RiskAssessment(
            case_id=case.case_id,
            risk_score=round(final_score, 1),
            risk_category=risk_category,
            score_type="RULE_BASED_SCORE",
            rule_warnings=warnings,
            contributing_factors=factors,
            recommended_actions=recommended_actions,
            last_verified_update=case.last_updated_at or datetime.utcnow(),
            data_freshness_days=stale_days,
            model_version="rule-engine-v1.0",
            data_source=case.data_source
        )

risk_engine = TransparentRiskEngine()
