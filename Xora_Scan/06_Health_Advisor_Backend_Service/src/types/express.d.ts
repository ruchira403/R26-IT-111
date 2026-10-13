import type { User } from "@prisma/client";

export type AuthenticatedUser = Pick<
  User,
  "id" | "email" | "role" | "isActive" | "createdAt" | "updatedAt"
>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

export {};
