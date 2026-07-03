import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { validate } from "../../middlewares/validate";
import { healthAdvisorController } from "./health-advisor.controller";
import { predictSchema } from "./health-advisor.schema";

const router = Router();

router.post(
  "/predict",
  authGuard.anyAuthenticated,
  validate(predictSchema),
  healthAdvisorController.predict,
);

export default router;
