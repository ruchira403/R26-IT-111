import { randomUUID } from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config/config";

export type TokenPayload = {
  sub: string;
  userId: number;
  role: string;
  sessionId: string;
  tokenType: "access" | "refresh";
};

type BaseTokenPayload = Omit<TokenPayload, "tokenType">;

const jwtAudience = "health-advisor";
const jwtIssuer = "health-advisor-auth-service";

const tokenOptions: Pick<SignOptions, "algorithm" | "audience" | "issuer"> = {
  algorithm: "HS256",
  audience: jwtAudience,
  issuer: jwtIssuer,
};

export function generateSessionId(): string {
  return randomUUID();
}

export function signAccessToken(payload: BaseTokenPayload): string {
  return jwt.sign(
    { ...payload, tokenType: "access" },
    config.jwt.accessSecret,
    {
      ...tokenOptions,
      expiresIn: config.jwt.accessExpiry as SignOptions["expiresIn"],
    },
  );
}

export function signRefreshToken(payload: BaseTokenPayload): string {
  return jwt.sign(
    { ...payload, tokenType: "refresh" },
    config.jwt.refreshSecret,
    {
      ...tokenOptions,
      expiresIn: config.jwt.refreshExpiry as SignOptions["expiresIn"],
    },
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret, {
      audience: jwtAudience,
      issuer: jwtIssuer,
    }) as unknown as TokenPayload;

    return payload.tokenType === "access" ? payload : null;
  } catch {
    return null;
  }
}

export function durationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])?$/.exec(duration.trim());

  if (!match) {
    return 7 * 24 * 60 * 60;
  }

  const value = Number(match[1]);
  const unit = match[2] ?? "s";

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * multipliers[unit];
}
