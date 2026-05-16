import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

/**
 * POST /auth/register
 * Body: { name, email, password }
 * 201 → { message: "User registered successfully" }
 */
router.post("/register", register);

/**
 * POST /auth/login
 * Body: { email, password }
 * 200 → { access_token: "jwt_token" }
 */
router.post("/login", login);

export default router;
