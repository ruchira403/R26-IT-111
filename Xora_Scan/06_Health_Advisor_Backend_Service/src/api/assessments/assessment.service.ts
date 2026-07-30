import { Prisma, type HealthProfile, type detected_diseases } from "@prisma/client";
import { randomUUID } from "crypto";
import config from "../../config/config";
import { prisma } from "../../config/database";
import type {
  MappedHealthProfile,
  ModelSeverity,
  RiskAssessmentPayload,
  SavedAssessment,
  SupportedDisease,
} from "./assessment.types";

// TODO: Replace this temporary fallback when the scan pipeline stores the
// actual affected tooth count in dental_records or detected_diseases.
const TEMPORARY_AFFECTED_TEETH_COUNT = 1;
const SUPPORTED_PROFILE_USAGE_VALUES = new Set(["no", "medium", "high"]);
const SUPPORTED_ORAL_HYGIENE_VALUES = new Set(["good", "moderate", "poor"]);

const DISEASE_NAMES = {
  dentalCavity: "dentalcavity",
  periodontalBoneLoss: "periodontalboneloss",
  nonDental: "nondental",
  noDiseaseFound: "nodiseasefound",
} as const;

const DISEASE_TYPE_ALIASES: Record<string, string> = {
  dentalcavity: DISEASE_NAMES.dentalCavity,
  dentalcatiy: DISEASE_NAMES.dentalCavity,
  periodontalboneloss: DISEASE_NAMES.periodontalBoneLoss,
  nondental: DISEASE_NAMES.nonDental,
  nodiseasefound: DISEASE_NAMES.noDiseaseFound,
};

const SEVERITY_PRIORITY: Record<string, number> = {
  "level 1": 1,
  "level 2": 2,
  "level 3": 3,
};

type JsonResponse = Prisma.InputJsonValue;
type DentalRecordWithAssessmentData = Prisma.dental_recordsGetPayload<{
  include: {
    detected_diseases: true;
    risk_assessments: true;
  };
}>;

export class RiskAssessmentError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeDiseaseType(value: string | null | undefined): string {
  const normalizedValue = normalize(value).replace(/[^a-z0-9]/g, "");

  return DISEASE_TYPE_ALIASES[normalizedValue] ?? normalizedValue;
}

function isSupportedDisease(value: string): boolean {
  return (
    value === DISEASE_NAMES.dentalCavity ||
    value === DISEASE_NAMES.periodontalBoneLoss
  );
}

function isValidSeverity(value: string): boolean {
  return value in SEVERITY_PRIORITY;
}

export async function getLatestDentalRecord(userId: number) {
  const dentalRecord = await prisma.dental_records.findFirst({
    where: { user_id: userId },
    orderBy: [
      { created_at: "desc" },
      { id: "desc" },
    ],
  });

  if (!dentalRecord) {
    throw new RiskAssessmentError(
      404,
      "DENTAL_RECORD_NOT_FOUND",
      "No dental scan was found for your account.",
    );
  }

  return dentalRecord;
}

export async function getDentalRecordForUser(
  userId: number,
  dentalRecordId: number,
) {
  const dentalRecord = await prisma.dental_records.findFirst({
    where: {
      id: dentalRecordId,
      user_id: userId,
    },
  });

  if (!dentalRecord) {
    throw new RiskAssessmentError(
      404,
      "DENTAL_RECORD_NOT_FOUND",
      "The requested dental scan was not found for your account.",
    );
  }

  return dentalRecord;
}

export async function getRelatedDetectedDiseases(
  dentalRecordId: number,
  requireResult = true,
) {
  const diseases = await prisma.detected_diseases.findMany({
    where: { record_id: dentalRecordId },
    orderBy: { id: "asc" },
  });

  if (requireResult && diseases.length === 0) {
    throw new RiskAssessmentError(
      422,
      "SCAN_RESULT_INCOMPLETE",
      "The latest dental scan has no detected-disease result, so the risk assessment cannot be generated.",
    );
  }

  return diseases;
}

export function selectDetectedDiseaseForInitialAssessment(
  diseases: detected_diseases[],
): detected_diseases {
  const validSupportedDiseases = diseases
    .filter((disease) => {
      return (
        isSupportedDisease(normalizeDiseaseType(disease.disease_type)) &&
        isValidSeverity(normalize(disease.severity_level))
      );
    })
    .sort((left, right) => {
      const severityDifference =
        SEVERITY_PRIORITY[normalize(right.severity_level)] -
        SEVERITY_PRIORITY[normalize(left.severity_level)];

      if (severityDifference !== 0) return severityDifference;

      return right.id - left.id;
    });

  if (validSupportedDiseases[0]) {
    return validSupportedDiseases[0];
  }

  const supportedWithInvalidSeverity = diseases.find((disease) =>
    isSupportedDisease(normalizeDiseaseType(disease.disease_type)),
  );

  if (supportedWithInvalidSeverity) {
    return supportedWithInvalidSeverity;
  }

  const nonDental = diseases.find(
    (disease) =>
      normalizeDiseaseType(disease.disease_type) === DISEASE_NAMES.nonDental,
  );

  if (nonDental) return nonDental;

  const unknownDisease = diseases.find((disease) => {
    return (
      normalizeDiseaseType(disease.disease_type) !==
      DISEASE_NAMES.noDiseaseFound
    );
  });

  if (unknownDisease) return unknownDisease;

  return diseases[0];
}

export function validateDetectedDisease(disease: detected_diseases): void {
  const diseaseType = normalizeDiseaseType(disease.disease_type);

  if (diseaseType === DISEASE_NAMES.noDiseaseFound) {
    throw new RiskAssessmentError(
      422,
      "NO_DISEASE_FOUND",
      "No dental disease was detected in your latest scan, so a dental risk assessment is not required.",
    );
  }

  if (diseaseType === DISEASE_NAMES.nonDental) {
    throw new RiskAssessmentError(
      422,
      "NON_DENTAL_CONDITION",
      "The detected condition is not supported by the dental risk-assessment model. Please consult a qualified healthcare professional for further evaluation.",
    );
  }

  if (!isSupportedDisease(diseaseType)) {
    throw new RiskAssessmentError(
      422,
      "UNSUPPORTED_DISEASE_TYPE",
      "The detected disease type is not supported by the risk-assessment model.",
    );
  }

  if (!isValidSeverity(normalize(disease.severity_level))) {
    throw new RiskAssessmentError(
      422,
      "INVALID_SEVERITY_LEVEL",
      "The detected disease severity level is invalid or unsupported.",
    );
  }
}

export function mapDiseaseType(diseaseType: string): SupportedDisease {
  const normalizedDisease = normalizeDiseaseType(diseaseType);

  if (normalizedDisease === DISEASE_NAMES.dentalCavity) {
    return "dental_cavity";
  }

  if (normalizedDisease === DISEASE_NAMES.periodontalBoneLoss) {
    return "periodontal_bone_loss";
  }

  throw new RiskAssessmentError(
    422,
    "UNSUPPORTED_DISEASE_TYPE",
    "The detected disease type is not supported by the risk-assessment model.",
  );
}

export function mapSeverity(severityLevel: string | null): ModelSeverity {
  const normalizedSeverity = normalize(severityLevel);

  if (normalizedSeverity === "level 1") return "mild";
  if (normalizedSeverity === "level 2") return "moderate";
  if (normalizedSeverity === "level 3") return "severe";

  throw new RiskAssessmentError(
    422,
    "INVALID_SEVERITY_LEVEL",
    "The detected disease severity level is invalid or unsupported.",
  );
}

export async function getHealthProfile(userId: number) {
  const profile = await prisma.healthProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new RiskAssessmentError(
      422,
      "HEALTH_PROFILE_REQUIRED",
      "Please complete your health profile before generating a risk assessment.",
    );
  }

  return profile;
}

export function mapHealthProfile(profile: HealthProfile): MappedHealthProfile {
  return {
    age: profile.age,
    number_of_teeth: profile.numberOfTeeth,
    number_of_missing_teeth: profile.numberOfMissingTeeth,
    is_primary_teeth: profile.isPrimaryTeeth,
    smoking_status: normalize(profile.smokingStatus),
    alcohol_usage: normalize(profile.alcoholUsage),
    sugar_usage: normalize(profile.sugarUsage),
    brushing_frequency: profile.brushingFrequency,
    diabetes_status: profile.diabetesStatus,
    pregnancy_status: profile.pregnancyStatus,
    gum_bleeding: profile.gumBleeding,
    tooth_sensitivity: profile.toothSensitivity,
    calcium_or_vitamin_deficiency: profile.calciumOrVitaminDeficiency,
    number_of_filled_teeth: profile.numberOfFilledTeeth,
    overall_oral_hygiene_level: normalize(profile.overallOralHygieneLevel),
    preferred_language: profile.preferredLanguage.trim(),
  };
}

export function getAffectedTeethCount(): number {
  return TEMPORARY_AFFECTED_TEETH_COUNT;
}

export function prepareFinalWebhookPayload(
  profile: MappedHealthProfile,
  disease: detected_diseases,
  affectedTeethCount: number,
): RiskAssessmentPayload {
  return {
    ...profile,
    identified_disease: mapDiseaseType(disease.disease_type),
    disease_severity_from_xray: mapSeverity(disease.severity_level),
    affected_teeth_count: affectedTeethCount,
  };
}

function assertIntegerInRange(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RiskAssessmentError(
      422,
      "INVALID_ASSESSMENT_PAYLOAD",
      `The ${field} value in the health profile is invalid.`,
    );
  }
}

export function validatePreparedPayload(payload: RiskAssessmentPayload): void {
  assertIntegerInRange(payload.age, "age", 1, 120);
  assertIntegerInRange(payload.number_of_teeth, "number_of_teeth", 0, 32);
  assertIntegerInRange(
    payload.number_of_missing_teeth,
    "number_of_missing_teeth",
    0,
    32,
  );
  assertIntegerInRange(
    payload.number_of_filled_teeth,
    "number_of_filled_teeth",
    0,
    32,
  );
  assertIntegerInRange(payload.brushing_frequency, "brushing_frequency", 0, 2);
  assertIntegerInRange(
    payload.affected_teeth_count,
    "affected_teeth_count",
    0,
    32,
  );

  const booleanFields: Array<keyof RiskAssessmentPayload> = [
    "is_primary_teeth",
    "diabetes_status",
    "pregnancy_status",
    "gum_bleeding",
    "tooth_sensitivity",
    "calcium_or_vitamin_deficiency",
  ];

  if (booleanFields.some((field) => typeof payload[field] !== "boolean")) {
    throw new RiskAssessmentError(
      422,
      "INVALID_ASSESSMENT_PAYLOAD",
      "One or more boolean values in the health profile are invalid.",
    );
  }

  const usageValues = [
    payload.smoking_status,
    payload.alcohol_usage,
    payload.sugar_usage,
  ];

  if (usageValues.some((value) => !SUPPORTED_PROFILE_USAGE_VALUES.has(value))) {
    throw new RiskAssessmentError(
      422,
      "INVALID_ASSESSMENT_PAYLOAD",
      "One or more usage-level values in the health profile are invalid.",
    );
  }

  if (!SUPPORTED_ORAL_HYGIENE_VALUES.has(payload.overall_oral_hygiene_level)) {
    throw new RiskAssessmentError(
      422,
      "INVALID_ASSESSMENT_PAYLOAD",
      "The overall oral hygiene level in the health profile is invalid.",
    );
  }

  if (!payload.preferred_language) {
    throw new RiskAssessmentError(
      422,
      "INVALID_ASSESSMENT_PAYLOAD",
      "The preferred language in the health profile is required.",
    );
  }
}

export async function checkExistingAssessment(
  userId: number,
  dentalRecordId: number,
  detectedDiseaseId: number,
) {
  return prisma.risk_assessments.findFirst({
    where: {
      user_id: userId,
      dental_record_id: dentalRecordId,
      detected_disease_id: detectedDiseaseId,
      assessment_status: "SUCCESS",
    },
  });
}

export async function checkExistingAssessmentForScan(
  userId: number,
  dentalRecordId: number,
) {
  return prisma.risk_assessments.findFirst({
    where: {
      user_id: userId,
      dental_record_id: dentalRecordId,
      assessment_status: "SUCCESS",
    },
    orderBy: [
      { created_at: "desc" },
      { id: "desc" },
    ],
  });
}

export function generateAssessmentCode(id: number): string {
  return `RA${id.toString().padStart(6, "0")}`;
}

export async function callRiskAssessmentWebhook(
  payload: RiskAssessmentPayload,
): Promise<JsonResponse> {
  const webhookUrl = config.n8n.riskAssessmentWebhookUrl;

  if (!webhookUrl) {
    console.error("Risk assessment webhook configuration is missing");
    throw new RiskAssessmentError(
      500,
      "WEBHOOK_CONFIGURATION_ERROR",
      "The risk-assessment service is not configured.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.n8n.riskAssessmentTimeoutMs,
  );

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await response.text();

    if (!response.ok) {
      console.error("Risk assessment webhook returned a non-success status", {
        status: response.status,
        body: rawBody,
      });
      throw new RiskAssessmentError(
        502,
        "WEBHOOK_REQUEST_FAILED",
        "The risk-assessment service could not generate a result.",
      );
    }

    if (!rawBody.trim()) {
      console.error("Risk assessment webhook returned an empty response");
      throw new RiskAssessmentError(
        502,
        "WEBHOOK_EMPTY_RESPONSE",
        "The risk-assessment service returned an empty response.",
      );
    }

    try {
      const parsedBody = JSON.parse(rawBody) as JsonResponse | null;

      if (parsedBody === null) {
        throw new Error("Webhook response was JSON null");
      }

      return parsedBody;
    } catch (error) {
      console.error("Risk assessment webhook returned malformed JSON", error);
      throw new RiskAssessmentError(
        502,
        "WEBHOOK_INVALID_RESPONSE",
        "The risk-assessment service returned an invalid response.",
      );
    }
  } catch (error) {
    if (error instanceof RiskAssessmentError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      console.error("Risk assessment webhook request timed out", error);
      throw new RiskAssessmentError(
        504,
        "WEBHOOK_TIMEOUT",
        "The risk-assessment service timed out. Please try again later.",
      );
    }

    console.error("Risk assessment webhook connection failed", error);
    throw new RiskAssessmentError(
      502,
      "WEBHOOK_CONNECTION_FAILED",
      "The risk-assessment service is temporarily unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function saveAssessment(
  userId: number,
  dentalRecordId: number,
  detectedDiseaseId: number,
  inputSnapshot: RiskAssessmentPayload,
  assessmentResult: JsonResponse,
): Promise<SavedAssessment> {
  try {
    return await prisma.$transaction(async (tx) => {
      const createdAssessment = await tx.risk_assessments.create({
        data: {
          code: `PENDING-${randomUUID()}`,
          user_id: userId,
          dental_record_id: dentalRecordId,
          detected_disease_id: detectedDiseaseId,
          assessment_status: "SUCCESS",
          input_snapshot: inputSnapshot,
          assessment_result: assessmentResult,
        },
      });

      return tx.risk_assessments.update({
        where: { id: createdAssessment.id },
        data: {
          code: generateAssessmentCode(createdAssessment.id),
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingAssessment = await checkExistingAssessment(
        userId,
        dentalRecordId,
        detectedDiseaseId,
      );

      if (existingAssessment) return existingAssessment;
    }

    throw error;
  }
}

export function formatAssessmentResponse(assessment: SavedAssessment) {
  return {
    id: assessment.id,
    code: assessment.code,
    assessment_status: assessment.assessment_status,
    dental_record_id: assessment.dental_record_id,
    detected_disease_id: assessment.detected_disease_id,
    input_snapshot: assessment.input_snapshot,
    assessment_result: assessment.assessment_result,
    created_at: assessment.created_at,
  };
}

export function formatScanResponse(
  scan: DentalRecordWithAssessmentData,
  includeAssessments = false,
) {
  const successfulAssessments = scan.risk_assessments.map(
    formatAssessmentResponse,
  );

  return {
    id: scan.id,
    image_path: scan.image_path,
    quality_score: scan.quality_score,
    confidence_score: scan.confidence_score,
    exposure: scan.exposure,
    is_blurred: scan.is_blurred,
    created_at: scan.created_at,
    user_id: scan.user_id,
    detected_diseases: scan.detected_diseases.map((disease) => ({
      id: disease.id,
      record_id: disease.record_id,
      disease_type: disease.disease_type,
      severity_level: disease.severity_level,
      confidence: disease.confidence,
      created_at: disease.created_at,
    })),
    assessed: successfulAssessments.length > 0,
    ...(includeAssessments
      ? { assessments: successfulAssessments }
      : {}),
  };
}

async function generateAssessmentForRecord(
  userId: number,
  dentalRecord: { id: number },
) {
  const detectedDiseases = await getRelatedDetectedDiseases(dentalRecord.id);
  const selectedDisease =
    selectDetectedDiseaseForInitialAssessment(detectedDiseases);

  validateDetectedDisease(selectedDisease);

  const existingAssessment = await checkExistingAssessment(
    userId,
    dentalRecord.id,
    selectedDisease.id,
  );

  if (existingAssessment) {
    return {
      source: "existing" as const,
      assessment: formatAssessmentResponse(existingAssessment),
    };
  }

  const healthProfile = await getHealthProfile(userId);
  const mappedHealthProfile = mapHealthProfile(healthProfile);
  const affectedTeethCount = getAffectedTeethCount();
  const payload = prepareFinalWebhookPayload(
    mappedHealthProfile,
    selectedDisease,
    affectedTeethCount,
  );

  validatePreparedPayload(payload);

  const webhookResult = await callRiskAssessmentWebhook(payload);
  const assessment = await saveAssessment(
    userId,
    dentalRecord.id,
    selectedDisease.id,
    payload,
    webhookResult,
  );

  return {
    source: "generated" as const,
    assessment: formatAssessmentResponse(assessment),
  };
}

export const assessmentService = {
  async listMyScans(userId: number) {
    const scans = await prisma.dental_records.findMany({
      where: { user_id: userId },
      include: {
        detected_diseases: {
          orderBy: { id: "asc" },
        },
        risk_assessments: {
          where: { assessment_status: "SUCCESS" },
          orderBy: [
            { created_at: "desc" },
            { id: "desc" },
          ],
        },
      },
      orderBy: [
        { created_at: "desc" },
        { id: "desc" },
      ],
    });

    return scans.map((scan) => formatScanResponse(scan));
  },

  async getMyScanById(userId: number, dentalRecordId: number) {
    const scan = await prisma.dental_records.findFirst({
      where: {
        id: dentalRecordId,
        user_id: userId,
      },
      include: {
        detected_diseases: {
          orderBy: { id: "asc" },
        },
        risk_assessments: {
          where: { assessment_status: "SUCCESS" },
          orderBy: [
            { created_at: "desc" },
            { id: "desc" },
          ],
        },
      },
    });

    if (!scan) {
      throw new RiskAssessmentError(
        404,
        "DENTAL_RECORD_NOT_FOUND",
        "The requested dental scan was not found for your account.",
      );
    }

    return formatScanResponse(scan, true);
  },

  async assessSelectedScan(userId: number, dentalRecordId: number) {
    const dentalRecord = await getDentalRecordForUser(
      userId,
      dentalRecordId,
    );
    const existingAssessment = await checkExistingAssessmentForScan(
      userId,
      dentalRecord.id,
    );

    if (existingAssessment) {
      return {
        source: "existing" as const,
        assessment: formatAssessmentResponse(existingAssessment),
      };
    }

    return generateAssessmentForRecord(userId, dentalRecord);
  },

  async createInitialAssessment(userId: number) {
    const dentalRecord = await getLatestDentalRecord(userId);

    return generateAssessmentForRecord(userId, dentalRecord);
  },
};
