import type { Request, Response } from "express";
import { AuthError, authService } from "./auth.service";

function handleAuthError(error: unknown, res: Response) {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Auth error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  },

  async logout(req: Request, res: Response) {
    if (!req.user || !req.sessionId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      await authService.logout(req.user.id, req.sessionId);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const result = await authService.me(req.user.id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  },

  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        data: result,
      });
    } catch (error) {
      return handleAuthError(error, res);
    }
  },
};
