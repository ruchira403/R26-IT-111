import type { Request, Response } from "express";
import {
  assessmentService,
  RiskAssessmentError,
} from "./assessment.service";

function getAuthenticatedUserId(req: Request, res: Response): number | null {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return req.user.id;
}

function getScanId(req: Request): number {
  const scanId = Number(req.params.scanId);

  if (!Number.isInteger(scanId) || scanId <= 0) {
    throw new RiskAssessmentError(
      400,
      "INVALID_SCAN_ID",
      "The dental scan ID must be a positive integer.",
    );
  }

  return scanId;
}

function handleAssessmentError(error: unknown, res: Response) {
  if (error instanceof RiskAssessmentError) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error("Risk assessment error:", error);

  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
}

export const assessmentController = {
  async listMyScans(req: Request, res: Response) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    try {
      const scans = await assessmentService.listMyScans(userId);

      return res.status(200).json({
        success: true,
        data: { scans },
      });
    } catch (error) {
      return handleAssessmentError(error, res);
    }
  },

  async getMyScanById(req: Request, res: Response) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    try {
      const scan = await assessmentService.getMyScanById(
        userId,
        getScanId(req),
      );

      return res.status(200).json({
        success: true,
        data: { scan },
      });
    } catch (error) {
      return handleAssessmentError(error, res);
    }
  },

  async assessSelectedScan(req: Request, res: Response) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    try {
      const result = await assessmentService.assessSelectedScan(
        userId,
        getScanId(req),
      );
      const isExisting = result.source === "existing";

      return res.status(200).json({
        success: true,
        message: isExisting
          ? "This scan has already been assessed."
          : "Risk assessment generated successfully.",
        data: result,
      });
    } catch (error) {
      return handleAssessmentError(error, res);
    }
  },

  async createInitial(req: Request, res: Response) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    try {
      const result = await assessmentService.createInitialAssessment(userId);
      const isExisting = result.source === "existing";

      return res.status(200).json({
        success: true,
        message: isExisting
          ? "This scan has already been assessed."
          : "Risk assessment generated successfully.",
        data: result,
      });
    } catch (error) {
      return handleAssessmentError(error, res);
    }
  },
};
