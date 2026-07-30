import { Router } from "express";
import assessmentRoutes from "./assessments/assessment.routes";
import authRoutes from "./auth/auth.routes";
import healthAdvisorRoutes from "./health-advisor/health-advisor.routes";
import healthProfileRoutes from "./health-profile/health-profile.routes";

const router = Router();

router.use("/assessments", assessmentRoutes);
router.use("/auth", authRoutes);
router.use("/health-profile", healthProfileRoutes);
router.use("/health-advisor", healthAdvisorRoutes);

export default router;
