import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { redisClient } from "../config/redis";
import { verifyAccessToken } from "../utils/jwt";
import { sessionKey } from "../api/auth/auth.service";

function sendUnauthorized(res: Response, message = "Unauthorized") {
  return res.status(401).json({
    success: false,
    message,
  });
}

export const authGuard = {
  async anyAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return sendUnauthorized(res, "Bearer access token is required");
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();
    const payload = verifyAccessToken(accessToken);

    if (!payload) {
      return sendUnauthorized(res, "Invalid or expired access token");
    }

    const storedSession = await redisClient.get(sessionKey(payload.userId, payload.sessionId));

    if (!storedSession) {
      return sendUnauthorized(res, "Session expired or logged out");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendUnauthorized(res, "User no longer exists");
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    req.user = user;
    req.sessionId = payload.sessionId;

    return next();
  },

  allowRoles(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return sendUnauthorized(res);
      }

      const allowedRoles = roles.map((role) => role.toLowerCase());
      const hasRole = allowedRoles.includes(req.user.role.toLowerCase());

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      return next();
    };
  },
};
