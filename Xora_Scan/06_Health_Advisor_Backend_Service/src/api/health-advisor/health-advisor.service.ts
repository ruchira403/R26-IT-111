import config from "../../config/config";
import { prisma } from "../../config/database";
import { AuthError, formatHealthProfile } from "../auth/auth.service";

type PredictInput = {
  identified_disease: string;
  disease_severity_from_xray: string;
  affected_teeth_count: number;
};

export const healthAdvisorService = {
  async getLatestDentalScan(userId: number) {
    const dentalRecord = await prisma.dental_records.findFirst({
      where: { user_id: userId },
      orderBy: [
        { created_at: "desc" },
        { id: "desc" },
      ],
    });

    if (!dentalRecord) {
      throw new AuthError(404, "No dental scans found for this user");
    }

    const detectedDiseases = await prisma.detected_diseases.findMany({
      where: { record_id: dentalRecord.id },
      select: {
        id: true,
        record_id: true,
        disease_type: true,
        severity_level: true,
        confidence: true,
        created_at: true,
      },
      orderBy: { id: "asc" },
    });

    return {
      dentalRecord,
      detectedDiseases,
    };
  },

  async predict(userId: number, input: PredictInput) {
    const profile = await prisma.healthProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AuthError(404, "Health profile is required before prediction");
    }

    const payload = {
      user_id: userId,
      healthProfile: formatHealthProfile(profile),
      disease: input,
    };

    if (!config.n8n.webhookUrl) {
      return {
        mode: "prepared_payload",
        payload,
      };
    }

    const response = await fetch(config.n8n.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      throw new AuthError(response.status, "n8n webhook request failed");
    }

    return {
      mode: "webhook_response",
      payload,
      response: responseBody,
    };
  },
};
