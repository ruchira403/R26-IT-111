import type { Request, Response } from "express";
import {
  assessmentService,
  RiskAssessmentError,
} from "./assessment.service";

export const assessmentController = {
  async createInitial(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const result = await assessmentService.createInitialAssessment(req.user.id);
      const isExisting = result.source === "existing";

      return res.status(200).json({
        success: true,
        message: isExisting
          ? "This scan has already been assessed."
          : "Risk assessment generated successfully.",
        data: result,
      });
    } catch (error) {
      if (error instanceof RiskAssessmentError) {
        return res.status(error.statusCode).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      console.error("Initial risk assessment error:", error);

      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      });
    }
  },
};
