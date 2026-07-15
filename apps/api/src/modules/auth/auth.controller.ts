import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendSuccess } from "../../common/apiResponse";
import { asyncHandler } from "../../common/asyncHandler";
import { isProduction } from "../../config/env";
import { UnauthorizedError } from "../../common/errors";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "@waypoint/types";

const REFRESH_COOKIE_NAME = "waypoint_refresh_token";

function requestContext(req: Request) {
  return { userAgent: req.headers["user-agent"], ipAddress: req.ip };
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    expires: expiresAt,
    path: "/api/v1/auth",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RegisterInput;
    const { user, tokens } = await authService.register(body, requestContext(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);
    sendSuccess(res, { user, accessToken: tokens.accessToken }, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as LoginInput;
    const { user, tokens } = await authService.login(body, requestContext(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);
    sendSuccess(res, { user, accessToken: tokens.accessToken });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedError("No active session found");
    }
    const { user, tokens } = await authService.refresh(refreshToken, requestContext(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);
    sendSuccess(res, { user, accessToken: tokens.accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    sendSuccess(res, { message: "Signed out" });
  }),

  logoutAllDevices: asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAllDevices(req.user!.id);
    clearRefreshCookie(res);
    sendSuccess(res, { message: "Signed out of all devices" });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    sendSuccess(res, { user });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ForgotPasswordInput;
    await authService.forgotPassword(body.email);
    sendSuccess(res, { message: "If that email exists, a reset link has been sent" });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ResetPasswordInput;
    await authService.resetPassword(body.token, body.password);
    sendSuccess(res, { message: "Password reset — you can now sign in" });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ChangePasswordInput;
    await authService.changePassword(req.user!.id, body.currentPassword, body.newPassword);
    sendSuccess(res, { message: "Password changed" });
  }),
};
