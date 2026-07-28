import type { Request, Response } from "express";
import { AuthError, formatUser } from "../auth/auth.service";
import { healthAdvisorService } from "./health-advisor.service";

function handlePredictError(error: unknown, res: Response) {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Health advisor error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export const healthAdvisorController = {
  async getLatestDentalScan(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const result = await healthAdvisorService.getLatestDentalScan(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          user: formatUser(req.user),
          dental_record: result.dentalRecord,
          detected_diseases: result.detectedDiseases,
        },
      });
    } catch (error) {
      return handlePredictError(error, res);
    }
  },

  async predict(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const result = await healthAdvisorService.predict(req.user.id, req.body);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handlePredictError(error, res);
    }
  },
};
