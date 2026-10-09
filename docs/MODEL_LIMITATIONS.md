# LandDelay AI — Model Limitations & Ethical Governance

## 1. Statutory Role: Decision Support Only
LandDelay AI is strictly an **administrative decision-support tool**.
- **No Legal Adjudication:** The application cannot and does not decide land ownership, title validity, compensation entitlement, or dispute resolution.
- **Human In the Loop:** Recommended follow-ups (e.g., "Convene Sub-Divisional Magistrate Conciliation") are non-binding operational prompts for designated administrative officers (District Collectors, Land Acquisition Officers).

## 2. Transparent Rules Engine vs. Machine Learning
- The primary risk classification engine is deterministic and rule-based (`TransparentRiskEngine`).
- Scores produced by this engine are always explicitly labelled `RULE_BASED_SCORE` (not "AI probability").
- **Overdue Milestone Priority Override:** If an acquisition milestone is overdue by 30 days or more, the system enforces a minimum risk score of 70 (HIGH RISK), preventing false negatives regardless of statistical priors.

## 3. Supervised Machine Learning Constraints
- **Target Definition:** "Predict whether a specified acquisition milestone will miss its approved deadline (`delayed = 1` vs `0`), using strictly pre-outcome information available at the prediction date."
- **Data Leakage Safeguard:** Features strictly exclude future milestone dates, actual completion timestamps, and final delay days.
- **Synthetic Training Caveat:**
  > **DISCLAIMER:** "SYNTHETIC-DATA EVALUATION — NOT EVIDENCE OF REAL-WORLD PREDICTIVE PERFORMANCE."
  Evaluations conducted on synthetic distributions reflect simulated dynamics and must not be presented as validated real-world performance.
- **Statistical Association, Not Causation:** Feature weights (e.g. compensation pending %, dispute counts) reflect correlational associations in training observations and do not assert causal mechanics.
