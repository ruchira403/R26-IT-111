import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/authGuard";
import { loginSchema, registerSchema } from "./auth.schema";
import { authController } from "./auth.controller";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authGuard.anyAuthenticated, authController.logout);
router.get("/me", authGuard.anyAuthenticated, authController.me);

export default router;
