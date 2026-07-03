import type { Request, Response } from "express";
import { AuthError } from "../auth/auth.service";
import { healthProfileService } from "./health-profile.service";

function handleHealthProfileError(error: unknown, res: Response) {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Health profile error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

function getUserId(req: Request, res: Response): number | null {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return req.user.id;
}

export const healthProfileController = {
  async getMine(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    try {
      const healthProfile = await healthProfileService.getMine(userId);

      return res.status(200).json({
        success: true,
        data: { healthProfile },
      });
    } catch (error) {
      return handleHealthProfileError(error, res);
    }
  },

  async create(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    try {
      const healthProfile = await healthProfileService.createMine(userId, req.body);

      return res.status(201).json({
        success: true,
        message: "Health profile created",
        data: { healthProfile },
      });
    } catch (error) {
      return handleHealthProfileError(error, res);
    }
  },

  async updateMine(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    try {
      const healthProfile = await healthProfileService.updateMine(userId, req.body);

      return res.status(200).json({
        success: true,
        message: "Health profile updated",
        data: { healthProfile },
      });
    } catch (error) {
      return handleHealthProfileError(error, res);
    }
  },

  async deleteMine(req: Request, res: Response) {
    const userId = getUserId(req, res);
    if (!userId) return;

    try {
      await healthProfileService.deleteMine(userId);

      return res.status(200).json({
        success: true,
        message: "Health profile deleted",
      });
    } catch (error) {
      return handleHealthProfileError(error, res);
    }
  },
};
