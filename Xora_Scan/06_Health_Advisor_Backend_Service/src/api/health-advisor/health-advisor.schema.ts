import Joi from "joi";

export const predictSchema = Joi.object({
  identified_disease: Joi.string().required(),
  disease_severity_from_xray: Joi.string().required(),
  affected_teeth_count: Joi.number().integer().min(0).max(32).required(),
});
