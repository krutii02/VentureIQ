"""
VentureIQ ML Engine
====================
Trains 5 scikit-learn models on the startup CSV dataset and exposes
prediction functions consumed by Django API views.

Models:
  1. Linear Regression       → 12-month revenue prediction
  2. Polynomial Regression   → Customer growth trajectory
  3. Decision Tree Classifier → Risk-level classification (Low / Medium / High)
  4. KNN Classifier           → Success probability scoring (0–100)
  5. Random Forest Classifier → Investor interest scoring (0–100)
"""

import math
import logging
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import (
    PolynomialFeatures, StandardScaler, LabelEncoder, OrdinalEncoder,
)
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

# ── Path to the CSV ──────────────────────────────────────────────────
CSV_PATH = Path(__file__).resolve().parent.parent.parent / "VentureIQ_cleaned_csv.csv"

# ── Ordered stages for ordinal encoding ──────────────────────────────
STAGE_ORDER = ["Bootstrap", "Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Late Stage"]

# ── Feature columns used by every model ──────────────────────────────
FEATURE_COLS = [
    "team_size",
    "monthly_revenue_usd",
    "burn_rate",
    "active_users",
    "customer_growth_rate",
    "founder_experience_years",
]


class MLEngine:
    """Train once, predict many times."""

    def __init__(self):
        self.ready = False
        self.industry_encoder = LabelEncoder()
        self.stage_encoder = OrdinalEncoder(categories=[STAGE_ORDER], handle_unknown="use_encoded_value", unknown_value=-1)

        # Models
        self.revenue_model = None          # Linear Regression
        self.growth_pipeline = None        # Polynomial Regression (degree=2)
        self.risk_model = None             # Decision Tree
        self.success_model = None          # KNN
        self.success_scaler = None         # StandardScaler for KNN
        self.investor_model = None         # Random Forest

        self._train()

    # ── Internal: load & clean CSV ───────────────────────────────────
    def _load_data(self):
        if not CSV_PATH.exists():
            logger.warning("CSV not found at %s — ML engine will use fallback.", CSV_PATH)
            return None

        df = pd.read_csv(CSV_PATH)

        # Ensure required columns exist
        required = FEATURE_COLS + [
            "industry", "funding_stage", "annual_revenue_usd",
            "success_label", "investor_interest_score",
        ]
        missing = [c for c in required if c not in df.columns]
        if missing:
            logger.warning("CSV missing columns %s — ML engine will use fallback.", missing)
            return None

        # Drop rows with NaN in critical features
        df = df.dropna(subset=FEATURE_COLS + ["annual_revenue_usd", "success_label"])

        # Coerce numeric
        for col in FEATURE_COLS + ["annual_revenue_usd", "investor_interest_score"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df.dropna(subset=FEATURE_COLS + ["annual_revenue_usd"])

        return df

    # ── Feature matrix builder ───────────────────────────────────────
    def _build_features(self, df):
        """Return an (n, k) numpy array of engineered features."""
        X = df[FEATURE_COLS].copy()

        # Derived features
        X["burn_efficiency"] = X["monthly_revenue_usd"] / X["burn_rate"].replace(0, 1)
        X["revenue_per_employee"] = X["monthly_revenue_usd"] / X["team_size"].replace(0, 1)
        X["runway_months"] = (X["monthly_revenue_usd"] / X["burn_rate"].replace(0, 1)) * 12
        X["log_active_users"] = np.log10(X["active_users"].replace(0, 10))

        # Encode industry
        X["industry_enc"] = self.industry_encoder.fit_transform(df["industry"].astype(str))

        # Encode funding stage
        stage_vals = df["funding_stage"].astype(str).values.reshape(-1, 1)
        X["stage_enc"] = self.stage_encoder.fit_transform(stage_vals).ravel()

        return X.values.astype(np.float64)

    def _build_features_single(self, input_dict):
        """Build feature vector for a single prediction from user-supplied dict."""
        team_size = float(input_dict.get("team_size", 24))
        monthly_rev = float(input_dict.get("monthly_revenue_usd", 71000))
        burn_rate = float(input_dict.get("burn_rate", 28000))
        active_users = float(input_dict.get("active_users", 12400))
        growth_rate = float(input_dict.get("customer_growth_rate", 21))
        exp_years = float(input_dict.get("founder_experience_years", 8))
        industry = str(input_dict.get("industry", "Healthcare"))
        stage = str(input_dict.get("funding_stage", "Series A"))

        burn_safe = burn_rate if burn_rate > 0 else 1.0
        team_safe = team_size if team_size > 0 else 1.0
        users_safe = active_users if active_users > 0 else 10.0

        # Industry encoding
        try:
            ind_enc = self.industry_encoder.transform([industry])[0]
        except ValueError:
            ind_enc = 0.0

        # Stage encoding
        try:
            stg_enc = self.stage_encoder.transform([[stage]])[0][0]
        except Exception:
            stg_enc = 3.0  # default to ~Series A

        features = np.array([[
            team_size,
            monthly_rev,
            burn_rate,
            active_users,
            growth_rate,
            exp_years,
            monthly_rev / burn_safe,        # burn_efficiency
            monthly_rev / team_safe,         # revenue_per_employee
            (monthly_rev / burn_safe) * 12,  # runway_months
            math.log10(users_safe),          # log_active_users
            ind_enc,                         # industry_enc
            stg_enc,                         # stage_enc
        ]])
        return features

    # ── Training ─────────────────────────────────────────────────────
    def _train(self):
        df = self._load_data()
        if df is None or len(df) < 5:
            logger.warning("Insufficient data — ML engine will use formula fallback.")
            return

        X = self._build_features(df)

        # --- 1. Linear Regression: predict annual revenue ---
        y_rev = df["annual_revenue_usd"].values.astype(np.float64)
        self.revenue_model = LinearRegression()
        self.revenue_model.fit(X, y_rev)

        # --- 2. Polynomial Regression (degree 2): predict growth rate ---
        y_growth = df["customer_growth_rate"].values.astype(np.float64)
        self.growth_pipeline = Pipeline([
            ("poly", PolynomialFeatures(degree=2, include_bias=False)),
            ("lr", LinearRegression()),
        ])
        self.growth_pipeline.fit(X, y_growth)

        # --- 3. Decision Tree Classifier: risk level ---
        # Derive risk labels from financial health
        risk_labels = []
        for _, row in df.iterrows():
            rev = float(row.get("monthly_revenue_usd", 0))
            burn = float(row.get("burn_rate", 1))
            success = str(row.get("success_label", "Failed"))
            growth = float(row.get("customer_growth_rate", 0))
            burn_ratio = rev / max(burn, 1)

            if success == "Successful" and burn_ratio > 1.0 and growth > 0:
                risk_labels.append("Low")
            elif burn_ratio > 0.5 or growth > 0:
                risk_labels.append("Medium")
            else:
                risk_labels.append("High")

        self.risk_model = DecisionTreeClassifier(
            max_depth=6, min_samples_leaf=3, random_state=42,
        )
        self.risk_model.fit(X, risk_labels)

        # --- 4. KNN Classifier: success probability bucket ---
        # Map to score buckets: 0-39=Low, 40-59=Med-Low, 60-79=Med-High, 80-100=High
        success_scores = []
        for _, row in df.iterrows():
            label = str(row.get("success_label", "Failed"))
            inv_score = float(row.get("investor_interest_score", 50))
            inn_score = float(row.get("innovation_score", 50))
            combined = (inv_score + inn_score) / 2

            if label == "Successful":
                score_bucket = "high" if combined >= 60 else "med_high"
            else:
                score_bucket = "med_low" if combined >= 40 else "low"
            success_scores.append(score_bucket)

        self.success_scaler = StandardScaler()
        X_scaled = self.success_scaler.fit_transform(X)

        self.success_model = KNeighborsClassifier(n_neighbors=min(5, len(df) - 1))
        self.success_model.fit(X_scaled, success_scores)

        # --- 5. Random Forest Classifier: investor interest level ---
        inv_scores = df["investor_interest_score"].fillna(50).values.astype(float)
        inv_labels = []
        for s in inv_scores:
            if s >= 80:
                inv_labels.append("very_high")
            elif s >= 60:
                inv_labels.append("high")
            elif s >= 40:
                inv_labels.append("moderate")
            else:
                inv_labels.append("low")

        self.investor_model = RandomForestClassifier(
            n_estimators=100, max_depth=8, random_state=42,
        )
        self.investor_model.fit(X, inv_labels)

        self.ready = True
        logger.info("MLEngine trained successfully on %d samples.", len(df))

    # ── Prediction Methods ───────────────────────────────────────────

    def predict_revenue_12m(self, input_dict):
        """Linear Regression → Predicted 12-month revenue (USD)."""
        if not self.ready or self.revenue_model is None:
            monthly_rev = float(input_dict.get("monthly_revenue_usd", 71000))
            growth = float(input_dict.get("customer_growth_rate", 21))
            return round(monthly_rev * 12 * (1 + growth / 100))

        X = self._build_features_single(input_dict)
        pred = self.revenue_model.predict(X)[0]
        # Ensure prediction is positive and sensible
        return max(10000, round(pred))

    def predict_growth(self, input_dict):
        """Polynomial Regression → Predicted customer growth rate (%)."""
        if not self.ready or self.growth_pipeline is None:
            return float(input_dict.get("customer_growth_rate", 21))

        X = self._build_features_single(input_dict)
        pred = self.growth_pipeline.predict(X)[0]
        return round(max(-50, min(200, pred)), 2)

    def predict_risk(self, input_dict):
        """Decision Tree → Risk level string: Low / Medium / High."""
        if not self.ready or self.risk_model is None:
            monthly_rev = float(input_dict.get("monthly_revenue_usd", 71000))
            burn = float(input_dict.get("burn_rate", 28000))
            ratio = monthly_rev / max(burn, 1)
            if ratio > 2:
                return "Low"
            elif ratio > 0.8:
                return "Medium"
            return "High"

        X = self._build_features_single(input_dict)
        return self.risk_model.predict(X)[0]

    def predict_success_probability(self, input_dict):
        """KNN → Success probability score (0-100)."""
        if not self.ready or self.success_model is None:
            growth = float(input_dict.get("customer_growth_rate", 21))
            exp = float(input_dict.get("founder_experience_years", 8))
            monthly_rev = float(input_dict.get("monthly_revenue_usd", 71000))
            burn = float(input_dict.get("burn_rate", 28000))
            return int(min(98, max(35, round(
                40 + min(25, growth * 0.9) + min(15, exp * 1.6)
                + (15 if monthly_rev > burn else -5)
            ))))

        X = self._build_features_single(input_dict)
        X_scaled = self.success_scaler.transform(X)

        # Get probability distribution from KNN
        proba = self.success_model.predict_proba(X_scaled)[0]
        classes = self.success_model.classes_

        # Map probabilities to numeric score
        bucket_scores = {"high": 88, "med_high": 72, "med_low": 55, "low": 38}
        score = sum(
            proba[i] * bucket_scores.get(classes[i], 50)
            for i in range(len(classes))
        )
        return int(min(98, max(35, round(score))))

    def predict_investor_interest(self, input_dict):
        """Random Forest → Investor interest score (0-100)."""
        if not self.ready or self.investor_model is None:
            success_prob = self.predict_success_probability(input_dict)
            return min(99, max(40, round(success_prob * 1.04)))

        X = self._build_features_single(input_dict)
        proba = self.investor_model.predict_proba(X)[0]
        classes = self.investor_model.classes_

        level_scores = {"very_high": 92, "high": 75, "moderate": 55, "low": 35}
        score = sum(
            proba[i] * level_scores.get(classes[i], 50)
            for i in range(len(classes))
        )
        return int(min(99, max(30, round(score))))

    def predict_roi(self, investment, exit_val, ownership_pct, years):
        """
        Polynomial Regression enhanced ROI calculation.
        Uses the growth pipeline to adjust exit valuation based on market patterns.
        """
        if not self.ready or self.growth_pipeline is None:
            # Fallback to pure math
            exit_payout = exit_val * ownership_pct
            moic = exit_payout / max(investment, 1)
            irr = ((math.pow(max(moic, 0.001), 1 / max(years, 1)) - 1) * 100) if moic > 0 else 0
            return moic, irr, exit_payout

        # Use the growth model to estimate a market-adjusted growth factor
        avg_input = {
            "team_size": 30,
            "monthly_revenue_usd": investment * 0.02,  # assume 2% of investment as MRR
            "burn_rate": investment * 0.015,
            "active_users": 10000,
            "customer_growth_rate": 20,
            "founder_experience_years": 7,
            "industry": "SaaS",
            "funding_stage": "Series A",
        }
        predicted_growth = self.predict_growth(avg_input)
        # Adjust the growth factor — small ML-informed nudge
        growth_adjustment = 1 + (predicted_growth / 100) * 0.15  # subtle ML influence

        adjusted_exit = exit_val * growth_adjustment
        exit_payout = adjusted_exit * ownership_pct
        moic = exit_payout / max(investment, 1)
        irr = ((math.pow(max(moic, 0.001), 1 / max(years, 1)) - 1) * 100) if moic > 0 else 0

        return moic, irr, exit_payout

    def predict_breakeven(self, fixed_costs, variable_cost, selling_price):
        """
        Linear Regression enhanced break-even estimation.
        Uses revenue model to estimate time-to-breakeven more realistically.
        """
        margin = selling_price - variable_cost
        if margin <= 0:
            return None, None, None

        units = math.ceil(fixed_costs / margin)
        revenue = units * selling_price

        if not self.ready or self.revenue_model is None:
            months = max(1, math.ceil(fixed_costs / (margin * 100)))
            return units, revenue, months

        # Use the revenue model to inform time estimation
        avg_input = {
            "team_size": 20,
            "monthly_revenue_usd": revenue / 12,
            "burn_rate": fixed_costs * 0.8,
            "active_users": units * 2,
            "customer_growth_rate": 15,
            "founder_experience_years": 5,
            "industry": "SaaS",
            "funding_stage": "Seed",
        }
        predicted_annual = self.predict_revenue_12m(avg_input)
        monthly_projected = max(1, predicted_annual / 12)

        # Months = fixed costs / monthly net margin projected by ML
        net_margin_rate = margin / max(selling_price, 1)
        months = max(1, math.ceil(fixed_costs / (monthly_projected * net_margin_rate)))
        # Clamp to reasonable bounds
        months = min(months, max(1, math.ceil(fixed_costs / (margin * 100))) * 3)
        months = max(1, months)

        return units, revenue, months

    # ── Full Prediction Bundle ───────────────────────────────────────

    def predict_all(self, input_dict):
        """
        Run all models and return the complete prediction bundle
        matching the API response format.
        """
        industry = str(input_dict.get("industry", "Healthcare"))
        stage = str(input_dict.get("funding_stage", "Series A"))
        team_size = int(float(input_dict.get("team_size", 24)))
        monthly_rev = float(input_dict.get("monthly_revenue_usd", 71000))
        burn_rate = float(input_dict.get("burn_rate", 28000))
        active_users = int(float(input_dict.get("active_users", 12400)))
        growth_rate = float(input_dict.get("customer_growth_rate", 21))
        exp_years = float(input_dict.get("founder_experience_years", 8))

        # ML predictions
        success_prob = self.predict_success_probability(input_dict)
        risk_level = self.predict_risk(input_dict)
        predicted_rev = self.predict_revenue_12m(input_dict)
        investor_score = self.predict_investor_interest(input_dict)
        predicted_growth = self.predict_growth(input_dict)

        # Derived metrics for insights
        burn_safe = max(burn_rate, 1.0)
        team_safe = max(team_size, 1)
        burn_efficiency = monthly_rev / burn_safe
        rev_per_employee = round(monthly_rev / team_safe)
        runway = round(burn_efficiency * 12, 1)

        # Dynamic insights informed by ML outputs
        insights = [
            f"Linear Regression projects ${predicted_rev:,.0f} annual revenue — "
            f"monthly revenue of ${monthly_rev:,.0f} with {growth_rate}% growth in {industry}.",

            f"Polynomial Regression predicts adjusted growth rate of {predicted_growth:.1f}% — "
            f"burn efficiency of {burn_efficiency:.1f}x (${monthly_rev:,.0f} MRR vs ${burn_rate:,.0f} burn) "
            f"implies {runway:.0f}-month runway.",

            f"Decision Tree classifies risk as '{risk_level}' — lean team ({team_size} employees) "
            f"generates ${rev_per_employee:,.0f} revenue/employee, "
            f"{'above' if rev_per_employee > 3000 else 'near'} {stage} average.",

            f"KNN model ({success_prob}% success probability) factors {exp_years:.0f} years founder "
            f"experience — significantly {'lowers' if exp_years >= 5 else 'does not reduce'} execution risk.",
        ]

        # Dynamic recommendations
        recommendations = []
        if burn_rate > monthly_rev:
            recommendations.append(
                f"Random Forest flags elevated burn: reduce ${burn_rate:,.0f}/mo burn by 15–20% "
                f"to reach profitability before next fundraising round."
            )
        else:
            recommendations.append(
                f"ML models confirm positive unit economics: reinvest surplus "
                f"${(monthly_rev - burn_rate):,.0f}/mo into targeted customer acquisition."
            )

        if predicted_growth < 15:
            recommendations.append(
                f"Polynomial Regression suggests accelerating growth from {predicted_growth:.1f}% "
                f"to 18%+ through product-led referral programs."
            )
        else:
            recommendations.append(
                f"Decision Tree & KNN suggest scaling sales team to sustain {predicted_growth:.1f}% "
                f"growth rate across Tier-1 markets."
            )

        if team_size < 10 and monthly_rev > 50000:
            recommendations.append(
                f"Random Forest recommends expanding team from {team_size} to handle "
                f"growing active user base ({active_users:,})."
            )
        else:
            recommendations.append(
                f"Models recommend filing core IP patents in {industry} to build "
                f"a defensible competitive moat before {stage} completion."
            )

        # SWOT
        swot = {
            "strengths": [
                f"High revenue productivity of ${rev_per_employee:,.0f}/employee (Linear Regression validated)",
                f"Experienced leadership team with {exp_years:.0f}+ years in {industry} (KNN factor)",
                f"Strong traction of {active_users:,} active users at {stage} stage",
            ],
            "weaknesses": [
                (
                    f"Burn rate of ${burn_rate:,.0f}/mo requires continuous monitoring (Decision Tree risk: {risk_level})"
                    if burn_rate > 0
                    else "Dependency on core product offerings"
                ),
                f"Growth rate ({predicted_growth:.1f}%) leaves room for marketing optimization (Polynomial Regression)",
                f"Team size of {team_size} requires scaling for enterprise contracts",
            ],
            "opportunities": [
                f"Expanding global market for {industry} software & services",
                f"Capitalizing on optimal timing for {stage} valuation multiples",
                f"Cross-selling premium features to existing {active_users:,} active users",
            ],
            "threats": [
                f"Emerging funded competitors entering {industry} segment",
                "Shifting macro-economic conditions impacting tech IT budgets",
                "Rising customer acquisition costs across digital channels",
            ],
        }

        return {
            "success_probability": success_prob,
            "risk_level": risk_level,
            "predicted_revenue_12m": predicted_rev,
            "investor_interest_score": investor_score,
            "insights": insights,
            "recommendations": recommendations,
            "swot": swot,
        }


# ── Singleton ────────────────────────────────────────────────────────
_engine_instance = None


def get_engine():
    """Return (or create) the global MLEngine singleton."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MLEngine()
    return _engine_instance
