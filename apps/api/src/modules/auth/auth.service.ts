import { addDays } from "date-fns";
import { authRepository } from "./auth.repository";
import { hashPassword, verifyPassword, generateOpaqueToken } from "../../lib/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { ConflictError, UnauthorizedError, ValidationError } from "../../common/errors";
import { logActivity } from "../../common/activityLogger";
import { ROLE_NAMES } from "../../common/permissions";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import type { LoginInput, RegisterInput } from "@waypoint/types";

interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function serializeUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  timezone: string;
  emailVerifiedAt: Date | null;
  role: { id: string; name: string };
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    timezone: user.timezone,
    emailVerified: Boolean(user.emailVerifiedAt),
    role: { id: user.role.id, name: user.role.name },
  };
}

async function issueTokens(
  user: { id: string; role: { id: string; name: string } },
  ctx: RequestContext,
): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: user.id, roleId: user.role.id, roleName: user.role.name });

  // The refresh token itself carries no session id yet — we create the
  // session row first, then re-sign a refresh token that references it,
  // so a stolen/leaked refresh JWT is useless without a matching,
  // non-revoked session row in the database.
  const provisionalToken = generateOpaqueToken();
  const refreshTokenExpiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS);

  const session = await authRepository.createSession({
    userId: user.id,
    refreshToken: provisionalToken,
    userAgent: ctx.userAgent,
    ipAddress: ctx.ipAddress,
    expiresAt: refreshTokenExpiresAt,
  });

  const refreshToken = signRefreshToken({ sub: user.id, sessionId: session.id });
  // Re-hash and store the *actual* JWT we hand back to the client, so
  // verification later compares like-for-like.
  await authRepository.rotateSession(session.id, refreshToken, refreshTokenExpiresAt);

  return { accessToken, refreshToken, refreshTokenExpiresAt };
}

export const authService = {
  async register(input: RegisterInput, ctx: RequestContext) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const defaultRole = await authRepository.getDefaultRole(ROLE_NAMES.TEAM_MEMBER);
    const passwordHash = await hashPassword(input.password);

    const user = await authRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      roleId: defaultRole.id,
    });

    await logActivity({ actorId: user.id, action: "user.registered", subjectType: "User", subjectId: user.id });

    const tokens = await issueTokens(user, ctx);
    logger.info({ userId: user.id }, "New user registered");

    return { user: serializeUser(user), tokens };
  },

  async login(input: LoginInput, ctx: RequestContext) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Incorrect email or password");
    }
    if (!user.isActive) {
      throw new UnauthorizedError("This account has been deactivated");
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    const tokens = await issueTokens(user, ctx);
    await logActivity({ actorId: user.id, action: "user.logged_in", subjectType: "User", subjectId: user.id });

    return { user: serializeUser(user), tokens };
  },

  async refresh(refreshToken: string, ctx: RequestContext) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Your session has expired — please sign in again");
    }

    const session = await authRepository.findActiveSessionByToken(refreshToken);
    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedError("Your session has expired — please sign in again");
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("This account is no longer active");
    }

    // Rotate: revoke the old session's token by overwriting its hash with
    // the new one, rather than merely re-verifying the same refresh token
    // forever — this bounds the lifetime of any single refresh JWT even if
    // access tokens keep getting renewed.
    const accessToken = signAccessToken({ sub: user.id, roleId: user.role.id, roleName: user.role.name });
    const newRefreshToken = signRefreshToken({ sub: user.id, sessionId: session.id });
    const refreshTokenExpiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS);
    await authRepository.rotateSession(session.id, newRefreshToken, refreshTokenExpiresAt, ctx);

    return { user: serializeUser(user), tokens: { accessToken, refreshToken: newRefreshToken, refreshTokenExpiresAt } };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    const session = await authRepository.findActiveSessionByToken(refreshToken);
    if (session) {
      await authRepository.revokeSession(session.id);
    }
  },

  async logoutAllDevices(userId: string) {
    await authRepository.revokeAllSessionsForUser(userId);
    await logActivity({ actorId: userId, action: "user.logged_out_all_devices", subjectType: "User", subjectId: userId });
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError();
    return serializeUser(user);
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    // Deliberately do not reveal whether the email exists — the response
    // is identical either way to prevent account enumeration.
    if (!user) return;

    const token = generateOpaqueToken();
    const expiresAt = addDays(new Date(), 1);
    await authRepository.createPasswordResetToken(user.id, token, expiresAt);

    // In production this dispatches through the SMTP-configured mailer
    // (see lib/mailer.ts, wired in Phase 6 alongside notifications). Logged
    // here so the flow is exercisable end-to-end without SMTP configured.
    logger.info({ userId: user.id, token }, "Password reset token issued");
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await authRepository.findValidPasswordResetToken(token);
    if (!record) {
      throw new ValidationError("This reset link is invalid or has expired");
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePasswordHash(record.userId, passwordHash);
    await authRepository.markPasswordResetTokenUsed(record.id);
    await authRepository.revokeAllSessionsForUser(record.userId);

    await logActivity({
      actorId: record.userId,
      action: "user.password_reset",
      subjectType: "User",
      subjectId: record.userId,
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError();

    const matches = await verifyPassword(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ValidationError("Current password is incorrect", { currentPassword: ["Current password is incorrect"] });
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePasswordHash(userId, passwordHash);
    // Changing your password revokes every other session as a precaution —
    // the device that just authenticated with the current password is the
    // one we trust to re-authenticate for a fresh pair of tokens.
    await authRepository.revokeAllSessionsForUser(userId);

    await logActivity({ actorId: userId, action: "user.password_changed", subjectType: "User", subjectId: userId });
  },
};
