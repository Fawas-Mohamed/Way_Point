import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from "@waypoint/types";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 */
authRouter.post("/register", authRateLimiter, validate(RegisterSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in with email and password
 */
authRouter.post("/login", authRateLimiter, validate(LoginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh cookie for a new access token
 */
authRouter.post("/refresh", authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Sign out of the current device
 */
authRouter.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Sign out of every device
 */
authRouter.post("/logout-all", requireAuth, authController.logoutAllDevices);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 */
authRouter.get("/me", requireAuth, authController.me);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 */
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validate(ForgotPasswordSchema),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a password using a reset token
 */
authRouter.post("/reset-password", authRateLimiter, validate(ResetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the current user's password
 */
authRouter.post(
  "/change-password",
  requireAuth,
  validate(ChangePasswordSchema),
  authController.changePassword,
);
