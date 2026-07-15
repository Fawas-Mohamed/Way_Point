import { prisma } from "../../lib/prisma";
import { sha256 } from "../../lib/hash";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  },

  findUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  },

  async createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleId: string;
  }) {
    return prisma.user.create({
      data: { ...input, notificationPrefs: { create: {} } },
      include: { role: true },
    });
  },

  getDefaultRole(roleName: string) {
    return prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  },

  createSession(input: { userId: string; refreshToken: string; userAgent?: string; ipAddress?: string; expiresAt: Date }) {
    return prisma.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: sha256(input.refreshToken),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
    });
  },

  findActiveSessionByToken(refreshToken: string) {
    return prisma.session.findFirst({
      where: { refreshTokenHash: sha256(refreshToken), revokedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  findSessionById(id: string) {
    return prisma.session.findUnique({ where: { id } });
  },

  revokeSession(id: string) {
    return prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  revokeAllSessionsForUser(userId: string) {
    return prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  rotateSession(
    sessionId: string,
    newRefreshToken: string,
    expiresAt: Date,
    ctx?: { userAgent?: string; ipAddress?: string },
  ) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: sha256(newRefreshToken),
        expiresAt,
        ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
        ...(ctx?.ipAddress ? { ipAddress: ctx.ipAddress } : {}),
      },
    });
  },

  createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: { userId, tokenHash: sha256(token), expiresAt },
    });
  },

  findValidPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash: sha256(token), usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },

  updatePasswordHash(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  markEmailVerified(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  },
};
