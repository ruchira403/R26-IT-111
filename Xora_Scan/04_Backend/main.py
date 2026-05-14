import json
import os
from contextlib import asynccontextmanager
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "outputs", "models")

# ---------------------------------------------------------------------------
# Global model state 
# ---------------------------------------------------------------------------
MODELS: dict = {}

TARGET_COLS = [
    "toothpaste_type",
    "mouthwash_type",
    "interdental_tool",
    "rinse_type",
    "pain_relief",
    "dietary_action",
    "dentist_urgency",
    "monitoring_focus",
    "lifestyle_action",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all models and metadata once at startup."""
    MODELS["risk_score"] = joblib.load(
        os.path.join(MODELS_DIR, "model1_risk_score_regressor.pkl")
    )
    MODELS["risk_level"] = joblib.load(
        os.path.join(MODELS_DIR, "model2_risk_level_classifier.pkl")
    )
    MODELS["care_plan"] = joblib.load(
        os.path.join(MODELS_DIR, "model3_careplan_recommender.pkl")
    )
    MODELS["label_encoders"] = joblib.load(
        os.path.join(MODELS_DIR, "careplan_label_encoders.pkl")
    )

    with open(os.path.join(MODELS_DIR, "feature_columns.json")) as f:
        MODELS["feature_cols"] = json.load(f)

    with open(os.path.join(MODELS_DIR, "ordinal_maps.json")) as f:
        MODELS["ordinal_maps"] = json.load(f)

    yield  # app runs here

    MODELS.clear()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Dental Risk Assessment API",
    description=(
        "Predicts oral health risk score, risk level, and personalised care plan "
        "using three XGBoost models trained on synthetic dental patient data."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class HealthProfile(BaseModel):
    # ── Demographics ────────────────────────────────────────────────────────
    age: int = Field(
        ...,
        ge=1,
        le=120,
        description="Patient age in years. Integer between 1 and 120.",
        examples=[35],
    )
    number_of_teeth: int = Field(
        ...,
        ge=0,
        le=32,
        description="Total number of natural teeth present (0–32).",
        examples=[28],
    )
    number_of_missing_teeth: int = Field(
        ...,
        ge=0,
        le=32,
        description="Number of teeth that are missing (0–32).",
        examples=[4],
    )
    is_primary_teeth: bool = Field(
        ...,
        description="True if the patient still has primary (baby) teeth, otherwise False.",
        examples=[False],
    )

    # ── Lifestyle habits ────────────────────────────────────────────────────
    smoking_status: Literal["no", "medium", "high"] = Field(
        ...,
        description=(
            "Smoking habit level.\n"
            "  • 'no'     – does not smoke\n"
            "  • 'medium' – occasional / light smoker\n"
            "  • 'high'   – heavy / regular smoker"
        ),
        examples=["no"],
    )
    alcohol_usage: Literal["no", "medium", "high"] = Field(
        ...,
        description=(
            "Alcohol consumption level.\n"
            "  • 'no'     – does not drink\n"
            "  • 'medium' – moderate drinker\n"
            "  • 'high'   – heavy drinker"
        ),
        examples=["medium"],
    )
    sugar_usage: Literal["no", "medium", "high"] = Field(
        ...,
        description=(
            "Dietary sugar intake level.\n"
            "  • 'no'     – low/no sugar diet\n"
            "  • 'medium' – moderate sugar intake\n"
            "  • 'high'   – high sugar intake"
        ),
        examples=["high"],
    )
    brushing_frequency: Literal[0, 1, 2] = Field(
        ...,
        description=(
            "Number of times the patient brushes per day.\n"
            "  • 0 – rarely or never\n"
            "  • 1 – once a day\n"
            "  • 2 – twice or more a day"
        ),
        examples=[1],
    )

    # ── Medical conditions ───────────────────────────────────────────────────
    diabetes_status: bool = Field(
        ...,
        description="True if the patient has diagnosed diabetes, otherwise False.",
        examples=[False],
    )
    pregnancy_status: bool = Field(
        ...,
        description="True if the patient is currently pregnant, otherwise False.",
        examples=[False],
    )
    gum_bleeding: bool = Field(
        ...,
        description="True if the patient experiences gum bleeding, otherwise False.",
        examples=[True],
    )
    tooth_sensitivity: bool = Field(
        ...,
        description="True if the patient has tooth sensitivity, otherwise False.",
        examples=[True],
    )
    calcium_or_vitamin_deficiency: bool = Field(
        ...,
        description=(
            "True if the patient has a diagnosed calcium or vitamin deficiency "
            "(e.g. Vitamin D / Vitamin K), otherwise False."
        ),
        examples=[False],
    )

    # ── Clinical exam findings ───────────────────────────────────────────────
    number_of_filled_teeth: int = Field(
        ...,
        ge=0,
        le=32,
        description="Number of teeth with existing fillings (0–32).",
        examples=[3],
    )
    overall_oral_hygiene_level: Literal["good", "moderate", "poor"] = Field(
        ...,
        description=(
            "Clinician-assessed overall oral hygiene level.\n"
            "  • 'good'     – minimal plaque/tartar\n"
            "  • 'moderate' – some build-up present\n"
            "  • 'poor'     – significant build-up / inflammation"
        ),
        examples=["moderate"],
    )
    identified_disease: Literal["dental_cavity", "periodontal_bone_loss"] = Field(
        ...,
        description=(
            "Primary disease identified during examination.\n"
            "  • 'dental_cavity'         – tooth decay / caries\n"
            "  • 'periodontal_bone_loss' – gum disease with bone involvement"
        ),
        examples=["dental_cavity"],
    )
    disease_severity_from_xray: Literal["mild", "moderate", "severe"] = Field(
        ...,
        description=(
            "Severity of the identified disease as assessed from X-ray imaging.\n"
            "  • 'mild'     – early stage\n"
            "  • 'moderate' – intermediate stage\n"
            "  • 'severe'   – advanced stage"
        ),
        examples=["moderate"],
    )
    affected_teeth_count: int = Field(
        ...,
        ge=0,
        le=32,
        description="Number of teeth affected by the identified disease (0–32).",
        examples=[5],
    )

    @model_validator(mode="after")
    def validate_tooth_counts(self) -> "HealthProfile":
        total = self.number_of_teeth + self.number_of_missing_teeth
        if total > 32:
            raise ValueError(
                "number_of_teeth + number_of_missing_teeth cannot exceed 32."
            )
        if self.number_of_filled_teeth > self.number_of_teeth:
            raise ValueError(
                "number_of_filled_teeth cannot exceed number_of_teeth."
            )
        if self.affected_teeth_count > self.number_of_teeth:
            raise ValueError(
                "affected_teeth_count cannot exceed number_of_teeth."
            )
        return self


class CarePlan(BaseModel):
    toothpaste_type: str
    mouthwash_type: str
    interdental_tool: str
    rinse_type: str
    pain_relief: str
    dietary_action: str
    dentist_urgency: str
    monitoring_focus: str
    lifestyle_action: str


class PredictResponse(BaseModel):
    risk_score: float = Field(
        description="Continuous risk score between 0 (lowest) and 100 (highest)."
    )
    risk_level: Literal["low", "medium", "high"] = Field(
        description=(
            "Categorical risk bucket.\n"
            "  • 'low'    – score 0–40\n"
            "  • 'medium' – score 41–70\n"
            "  • 'high'   – score 71–100"
        )
    )
    care_plan: CarePlan = Field(
        description="Nine personalised care plan recommendations."
    )


# ---------------------------------------------------------------------------
# Preprocessing helper
# ---------------------------------------------------------------------------
def _preprocess(profile: HealthProfile) -> pd.DataFrame:
    """Convert a validated HealthProfile into a model-ready DataFrame."""
    ordinal_maps: dict = MODELS["ordinal_maps"]
    feature_cols: list = MODELS["feature_cols"]

    p: dict = profile.model_dump()

    # Ordinal encode lifestyle / clinical categorical fields
    for col, mapping in ordinal_maps.items():
        p[col] = mapping[p[col]]

    # Binary encode identified_disease
    p["identified_disease"] = int(
        p["identified_disease"] == "periodontal_bone_loss"
    )

    # Booleans → int (already bool from Pydantic, but explicit cast is safe)
    for col in [
        "is_primary_teeth",
        "diabetes_status",
        "pregnancy_status",
        "gum_bleeding",
        "tooth_sensitivity",
        "calcium_or_vitamin_deficiency",
    ]:
        p[col] = int(p[col])

    # Engineered features
    total_teeth = p["number_of_teeth"] + p["number_of_missing_teeth"]
    p["missing_teeth_ratio"] = p["number_of_missing_teeth"] / max(total_teeth, 1)
    p["filled_teeth_ratio"] = p["number_of_filled_teeth"] / max(p["number_of_teeth"], 1)
    p["affected_teeth_ratio"] = p["affected_teeth_count"] / max(p["number_of_teeth"], 1)
    p["lifestyle_risk_score"] = (
        p["smoking_status"] + p["alcohol_usage"] + p["sugar_usage"]
    )
    p["oral_hygiene_risk_score"] = (
        p["overall_oral_hygiene_level"]
        + (2 - p["brushing_frequency"])
        + p["gum_bleeding"]
        + p["tooth_sensitivity"]
    )
    p["medical_risk_score"] = (
        p["diabetes_status"]
        + p["pregnancy_status"]
        + p["calcium_or_vitamin_deficiency"]
        + p["is_primary_teeth"]
    )

    return pd.DataFrame([{col: p[col] for col in feature_cols}])


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/health",
    summary="Health Check",
    description="Returns API status and confirms all three models are loaded.",
    tags=["Utility"],
)
def health_check():
    models_loaded = all(
        k in MODELS for k in ("risk_score", "risk_level", "care_plan")
    )
    return {
        "status": "ok" if models_loaded else "degraded",
        "models_loaded": {
            "risk_score_regressor": "risk_score" in MODELS,
            "risk_level_classifier": "risk_level" in MODELS,
            "care_plan_recommender": "care_plan" in MODELS,
        },
        "version": "1.0.0",
    }


@app.post(
    "/predict-risk",
    response_model=PredictResponse,
    summary="Predict Oral Health Risk & Care Plan",
    description=(
        "Accepts a patient health profile and returns:\n"
        "- **risk_score**: continuous 0–100\n"
        "- **risk_level**: low / medium / high\n"
        "- **care_plan**: 9 personalised dental care recommendations"
    ),
    tags=["Prediction"],
)
def predict_risk(profile: HealthProfile) -> PredictResponse:
    try:
        X = _preprocess(profile)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Preprocessing error: {exc}")

    try:
        # Model 1 – risk score (continuous)
        raw_score: float = float(MODELS["risk_score"].predict(X)[0])
        risk_score = round(float(np.clip(raw_score, 0.0, 100.0)), 2)

        # Model 2 – risk level (0=low, 1=medium, 2=high)
        level_enc: int = int(MODELS["risk_level"].predict(X)[0])
        risk_level: str = ["low", "medium", "high"][level_enc]

        # Model 3 – care plan (9 encoded predictions)
        care_enc = MODELS["care_plan"].predict(X)[0]
        label_encoders = MODELS["label_encoders"]
        care_plan_dict = {
            col: label_encoders[col].inverse_transform([enc])[0]
            for col, enc in zip(TARGET_COLS, care_enc)
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference error: {exc}")

    return PredictResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        care_plan=CarePlan(**care_plan_dict),
    )
