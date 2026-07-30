import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { assessmentController } from "./assessment.controller";

const router = Router();

router.use(authGuard.anyAuthenticated);

router.get(
  "/scans",
  assessmentController.listMyScans,
);

router.get(
  "/scans/:scanId",
  assessmentController.getMyScanById,
);

router.post(
  "/scans/:scanId/assess",
  assessmentController.assessSelectedScan,
);

router.post(
  "/initial",
  assessmentController.createInitial,
);

export default router;
