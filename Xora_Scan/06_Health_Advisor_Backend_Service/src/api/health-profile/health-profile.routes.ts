import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { validate } from "../../middlewares/validate";
import { healthProfileController } from "./health-profile.controller";
import {
  createHealthProfileSchema,
  updateHealthProfileSchema,
} from "./health-profile.schema";

const router = Router();

router.use(authGuard.anyAuthenticated);

router.get("/me", healthProfileController.getMine);
router.post("/", validate(createHealthProfileSchema), healthProfileController.create);
router.put("/me", validate(updateHealthProfileSchema), healthProfileController.updateMine);
router.delete("/me", healthProfileController.deleteMine);

export default router;
