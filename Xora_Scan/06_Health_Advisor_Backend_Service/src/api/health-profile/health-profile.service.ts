import { AuthError, formatHealthProfile, HealthProfileInput, toHealthProfileData } from "../auth/auth.service";
import { prisma } from "../../config/database";

export const healthProfileService = {
  async getMine(userId: number) {
    const profile = await prisma.healthProfile.findUnique({
      where: { userId },
    });

    return formatHealthProfile(profile);
  },

  async createMine(userId: number, input: HealthProfileInput) {
    const existingProfile = await prisma.healthProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new AuthError(409, "Health profile already exists");
    }

    const profile = await prisma.healthProfile.create({
      data: {
        ...toHealthProfileData(input),
        user: {
          connect: { id: userId },
        },
      },
    });

    return formatHealthProfile(profile);
  },

  async updateMine(userId: number, input: Partial<HealthProfileInput>) {
    const existingProfile = await prisma.healthProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new AuthError(404, "Health profile not found");
    }

    const mergedInput = {
      age: existingProfile.age,
      number_of_teeth: existingProfile.numberOfTeeth,
      number_of_missing_teeth: existingProfile.numberOfMissingTeeth,
      is_primary_teeth: existingProfile.isPrimaryTeeth,
      smoking_status: existingProfile.smokingStatus,
      alcohol_usage: existingProfile.alcoholUsage,
      sugar_usage: existingProfile.sugarUsage,
      brushing_frequency: existingProfile.brushingFrequency,
      diabetes_status: existingProfile.diabetesStatus,
      pregnancy_status: existingProfile.pregnancyStatus,
      gum_bleeding: existingProfile.gumBleeding,
      tooth_sensitivity: existingProfile.toothSensitivity,
      calcium_or_vitamin_deficiency: existingProfile.calciumOrVitaminDeficiency,
      number_of_filled_teeth: existingProfile.numberOfFilledTeeth,
      overall_oral_hygiene_level: existingProfile.overallOralHygieneLevel,
      preferred_language: existingProfile.preferredLanguage,
      ...input,
    } as HealthProfileInput;

    if (mergedInput.number_of_teeth + mergedInput.number_of_missing_teeth > 32) {
      throw new AuthError(400, "number_of_teeth + number_of_missing_teeth must be <= 32");
    }

    if (mergedInput.number_of_filled_teeth > mergedInput.number_of_teeth) {
      throw new AuthError(400, "number_of_filled_teeth must be <= number_of_teeth");
    }

    const profile = await prisma.healthProfile.update({
      where: { userId },
      data: toHealthProfileData(mergedInput),
    });

    return formatHealthProfile(profile);
  },

  async deleteMine(userId: number) {
    const existingProfile = await prisma.healthProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new AuthError(404, "Health profile not found");
    }

    await prisma.healthProfile.delete({
      where: { userId },
    });
  },
};
