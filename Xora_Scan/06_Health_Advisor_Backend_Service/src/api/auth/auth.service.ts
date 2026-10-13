import config from "../../config/config";
import { prisma } from "../../config/database";
import { redisClient } from "../../config/redis";
import { comparePassword, hashPassword } from "../../utils/password";
import {
  durationToSeconds,
  generateSessionId,
  signAccessToken,
  signRefreshToken,
} from "../../utils/jwt";

export type HealthProfileInput = {
  age: number;
  number_of_teeth: number;
  number_of_missing_teeth: number;
  is_primary_teeth: boolean;
  smoking_status: "no" | "medium" | "high";
  alcohol_usage: "no" | "medium" | "high";
  sugar_usage: "no" | "medium" | "high";
  brushing_frequency: 0 | 1 | 2;
  diabetes_status: boolean;
  pregnancy_status: boolean;
  gum_bleeding: boolean;
  tooth_sensitivity: boolean;
  calcium_or_vitamin_deficiency: boolean;
  number_of_filled_teeth: number;
  overall_oral_hygiene_level: "good" | "moderate" | "poor";
  preferred_language: string;
};

type RegisterInput = {
  email: string;
  password: string;
  role: string;
  healthProfile: HealthProfileInput;
};

type LoginInput = {
  email: string;
  password: string;
};

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function sessionKey(userId: number, sessionId: string): string {
  return `auth:session:${userId}:${sessionId}`;
}

export function toHealthProfileData(input: HealthProfileInput) {
  return {
    age: input.age,
    numberOfTeeth: input.number_of_teeth,
    numberOfMissingTeeth: input.number_of_missing_teeth,
    isPrimaryTeeth: input.is_primary_teeth,
    smokingStatus: input.smoking_status,
    alcoholUsage: input.alcohol_usage,
    sugarUsage: input.sugar_usage,
    brushingFrequency: input.brushing_frequency,
    diabetesStatus: input.diabetes_status,
    pregnancyStatus: input.pregnancy_status,
    gumBleeding: input.gum_bleeding,
    toothSensitivity: input.tooth_sensitivity,
    calciumOrVitaminDeficiency: input.calcium_or_vitamin_deficiency,
    numberOfFilledTeeth: input.number_of_filled_teeth,
    overallOralHygieneLevel: input.overall_oral_hygiene_level,
    preferredLanguage: input.preferred_language,
  };
}

export function formatUser(user: {
  id: number;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export function formatHealthProfile(
  profile:
    | {
        id: number;
        userId: number;
        age: number;
        numberOfTeeth: number;
        numberOfMissingTeeth: number;
        isPrimaryTeeth: boolean;
        smokingStatus: string;
        alcoholUsage: string;
        sugarUsage: string;
        brushingFrequency: number;
        diabetesStatus: boolean;
        pregnancyStatus: boolean;
        gumBleeding: boolean;
        toothSensitivity: boolean;
        calciumOrVitaminDeficiency: boolean;
        numberOfFilledTeeth: number;
        overallOralHygieneLevel: string;
        preferredLanguage: string;
        createdAt: Date;
        updatedAt: Date;
      }
    | null,
) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    user_id: profile.userId,
    age: profile.age,
    number_of_teeth: profile.numberOfTeeth,
    number_of_missing_teeth: profile.numberOfMissingTeeth,
    is_primary_teeth: profile.isPrimaryTeeth,
    smoking_status: profile.smokingStatus,
    alcohol_usage: profile.alcoholUsage,
    sugar_usage: profile.sugarUsage,
    brushing_frequency: profile.brushingFrequency,
    diabetes_status: profile.diabetesStatus,
    pregnancy_status: profile.pregnancyStatus,
    gum_bleeding: profile.gumBleeding,
    tooth_sensitivity: profile.toothSensitivity,
    calcium_or_vitamin_deficiency: profile.calciumOrVitaminDeficiency,
    number_of_filled_teeth: profile.numberOfFilledTeeth,
    overall_oral_hygiene_level: profile.overallOralHygieneLevel,
    preferred_language: profile.preferredLanguage,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

function createTokenPair(user: { id: number; role: string }) {
  const sessionId = generateSessionId();
  const tokenPayload = {
    sub: user.id.toString(),
    userId: user.id,
    role: user.role,
    sessionId,
  };

  return {
    sessionId,
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
}

async function storeSession(user: { id: number; role: string }, sessionId: string) {
  await redisClient.setEx(
    sessionKey(user.id, sessionId),
    durationToSeconds(config.jwt.refreshExpiry),
    JSON.stringify({
      userId: user.id,
      role: user.role,
      sessionId,
      createdAt: new Date().toISOString(),
    }),
  );
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AuthError(409, "Email already exists");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          healthProfile: {
            create: toHealthProfileData(input.healthProfile),
          },
        },
        include: {
          healthProfile: true,
        },
      });
    });

    return {
      user: formatUser(user),
      healthProfile: formatHealthProfile(user.healthProfile),
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.isActive) {
      throw new AuthError(401, "Invalid email or password");
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AuthError(401, "Invalid email or password");
    }

    const tokens = createTokenPair(user);
    await storeSession(user, tokens.sessionId);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async logout(userId: number, sessionId: string) {
    await redisClient.del(sessionKey(userId, sessionId));
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { healthProfile: true },
    });

    if (!user || !user.isActive) {
      throw new AuthError(401, "User no longer exists or is inactive");
    }

    return {
      user: formatUser(user),
      healthProfile: formatHealthProfile(user.healthProfile),
    };
  },
};
