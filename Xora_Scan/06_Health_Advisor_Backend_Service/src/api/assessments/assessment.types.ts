import type {
  HealthProfile,
  detected_diseases,
  risk_assessments,
} from "@prisma/client";

export type SupportedDisease = "dental_cavity" | "periodontal_bone_loss";
export type ModelSeverity = "mild" | "moderate" | "severe";

export type MappedHealthProfile = {
  age: number;
  number_of_teeth: number;
  number_of_missing_teeth: number;
  is_primary_teeth: boolean;
  smoking_status: string;
  alcohol_usage: string;
  sugar_usage: string;
  brushing_frequency: number;
  diabetes_status: boolean;
  pregnancy_status: boolean;
  gum_bleeding: boolean;
  tooth_sensitivity: boolean;
  calcium_or_vitamin_deficiency: boolean;
  number_of_filled_teeth: number;
  overall_oral_hygiene_level: string;
  preferred_language: string;
};

export type RiskAssessmentPayload = MappedHealthProfile & {
  identified_disease: SupportedDisease;
  disease_severity_from_xray: ModelSeverity;
  affected_teeth_count: number;
};

export type SelectedDisease = detected_diseases;
export type AssessmentProfile = HealthProfile;
export type SavedAssessment = risk_assessments;
