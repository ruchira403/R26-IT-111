import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

const usageLevel = Joi.string().valid("no", "medium", "high");
const oralHygieneLevel = Joi.string().valid("good", "moderate", "poor");

export const healthProfileSchema = Joi.object({
  age: Joi.number().integer().min(1).max(120).required(),
  number_of_teeth: Joi.number().integer().min(0).max(32).required(),
  number_of_missing_teeth: Joi.number().integer().min(0).max(32).required(),
  is_primary_teeth: Joi.boolean().default(false),
  smoking_status: usageLevel.required(),
  alcohol_usage: usageLevel.required(),
  sugar_usage: usageLevel.required(),
  brushing_frequency: Joi.number().integer().valid(0, 1, 2).required(),
  diabetes_status: Joi.boolean().default(false),
  pregnancy_status: Joi.boolean().default(false),
  gum_bleeding: Joi.boolean().default(false),
  tooth_sensitivity: Joi.boolean().default(false),
  calcium_or_vitamin_deficiency: Joi.boolean().default(false),
  number_of_filled_teeth: Joi.number().integer().min(0).max(32).default(0),
  overall_oral_hygiene_level: oralHygieneLevel.required(),
  preferred_language: Joi.string().max(10).default("en"),
})
  .custom((value, helpers) => {
    if (value.number_of_teeth + value.number_of_missing_teeth > 32) {
      return helpers.error("any.invalid", {
        message: "number_of_teeth + number_of_missing_teeth must be <= 32",
      });
    }

    if (value.number_of_filled_teeth > value.number_of_teeth) {
      return helpers.error("any.invalid", {
        message: "number_of_filled_teeth must be <= number_of_teeth",
      });
    }

    return value;
  })
  .messages({
    "any.invalid": "{{#message}}",
  });

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().max(50).default("USER"),
  healthProfile: healthProfileSchema.required(),
});
