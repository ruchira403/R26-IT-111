import type { User } from "@prisma/client";

export type AuthenticatedUser = Omit<User, "passwordHash">;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

export {};
