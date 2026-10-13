import Joi from "joi";

const usageLevel = Joi.string().valid("no", "medium", "high");
const oralHygieneLevel = Joi.string().valid("good", "moderate", "poor");

const fields = {
  age: Joi.number().integer().min(1).max(120),
  number_of_teeth: Joi.number().integer().min(0).max(32),
  number_of_missing_teeth: Joi.number().integer().min(0).max(32),
  is_primary_teeth: Joi.boolean(),
  smoking_status: usageLevel,
  alcohol_usage: usageLevel,
  sugar_usage: usageLevel,
  brushing_frequency: Joi.number().integer().valid(0, 1, 2),
  diabetes_status: Joi.boolean(),
  pregnancy_status: Joi.boolean(),
  gum_bleeding: Joi.boolean(),
  tooth_sensitivity: Joi.boolean(),
  calcium_or_vitamin_deficiency: Joi.boolean(),
  number_of_filled_teeth: Joi.number().integer().min(0).max(32),
  overall_oral_hygiene_level: oralHygieneLevel,
  preferred_language: Joi.string().max(10),
};

function validateTeethTotals(value: Record<string, number | undefined>, helpers: Joi.CustomHelpers) {
  const teeth = value.number_of_teeth;
  const missing = value.number_of_missing_teeth;
  const filled = value.number_of_filled_teeth;

  if (teeth !== undefined && missing !== undefined && teeth + missing > 32) {
    return helpers.error("any.invalid", {
      message: "number_of_teeth + number_of_missing_teeth must be <= 32",
    });
  }

  if (teeth !== undefined && filled !== undefined && filled > teeth) {
    return helpers.error("any.invalid", {
      message: "number_of_filled_teeth must be <= number_of_teeth",
    });
  }

  return value;
}

export const createHealthProfileSchema = Joi.object({
  age: fields.age.required(),
  number_of_teeth: fields.number_of_teeth.required(),
  number_of_missing_teeth: fields.number_of_missing_teeth.required(),
  is_primary_teeth: fields.is_primary_teeth.default(false),
  smoking_status: fields.smoking_status.required(),
  alcohol_usage: fields.alcohol_usage.required(),
  sugar_usage: fields.sugar_usage.required(),
  brushing_frequency: fields.brushing_frequency.required(),
  diabetes_status: fields.diabetes_status.default(false),
  pregnancy_status: fields.pregnancy_status.default(false),
  gum_bleeding: fields.gum_bleeding.default(false),
  tooth_sensitivity: fields.tooth_sensitivity.default(false),
  calcium_or_vitamin_deficiency: fields.calcium_or_vitamin_deficiency.default(false),
  number_of_filled_teeth: fields.number_of_filled_teeth.default(0),
  overall_oral_hygiene_level: fields.overall_oral_hygiene_level.required(),
  preferred_language: fields.preferred_language.default("en"),
})
  .custom(validateTeethTotals)
  .messages({ "any.invalid": "{{#message}}" });

export const updateHealthProfileSchema = Joi.object(fields)
  .min(1)
  .custom(validateTeethTotals)
  .messages({ "any.invalid": "{{#message}}" });
