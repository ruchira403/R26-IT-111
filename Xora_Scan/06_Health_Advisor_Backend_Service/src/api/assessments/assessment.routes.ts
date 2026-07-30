import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { assessmentController } from "./assessment.controller";

const router = Router();

router.post(
  "/initial",
  authGuard.anyAuthenticated,
  assessmentController.createInitial,
);

export default router;
