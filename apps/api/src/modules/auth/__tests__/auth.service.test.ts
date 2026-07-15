import { describe, expect, it, vi, beforeEach } from "vitest";
import { authService } from "../auth.service";
import { authRepository } from "../auth.repository";
import { ConflictError, UnauthorizedError } from "../../../common/errors";

vi.mock("../auth.repository", () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
    getDefaultRole: vi.fn(),
    createSession: vi.fn(),
    findActiveSessionByToken: vi.fn(),
    findSessionById: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    rotateSession: vi.fn(),
    createPasswordResetToken: vi.fn(),
    findValidPasswordResetToken: vi.fn(),
    markPasswordResetTokenUsed: vi.fn(),
    updatePasswordHash: vi.fn(),
    markEmailVerified: vi.fn(),
  },
}));
vi.mock("../../../common/activityLogger", () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../../lib/hash", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
  verifyPassword: vi.fn(),
  generateOpaqueToken: vi.fn().mockReturnValue("opaque-token"),
  sha256: vi.fn().mockReturnValue("hashed-token"),
}));
vi.mock("../../../lib/jwt", () => ({
  signAccessToken: vi.fn().mockReturnValue("access-token"),
  signRefreshToken: vi.fn().mockReturnValue("refresh-token"),
  verifyRefreshToken: vi.fn(),
}));

const mockedRepo = vi.mocked(authRepository);
const ctx = { userAgent: "vitest", ipAddress: "127.0.0.1" };

const fakeRole = { id: "role-team-member", name: "TEAM_MEMBER" };
const fakeUser = {
  id: "user-1",
  firstName: "Jonas",
  lastName: "Berg",
  email: "jonas@waypoint.app",
  avatarUrl: null,
  jobTitle: null,
  timezone: "UTC",
  passwordHash: "hashed-password",
  isActive: true,
  emailVerifiedAt: null,
  role: fakeRole,
};

describe("authService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws ConflictError when the email is already registered", async () => {
    mockedRepo.findUserByEmail.mockResolvedValue(fakeUser as never);

    await expect(
      authService.register(
        { firstName: "Jonas", lastName: "Berg", email: "jonas@waypoint.app", password: "Passw0rd!" },
        ctx,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("creates a new user with the default TEAM_MEMBER role and issues tokens", async () => {
    mockedRepo.findUserByEmail.mockResolvedValue(null);
    mockedRepo.getDefaultRole.mockResolvedValue(fakeRole as never);
    mockedRepo.createUser.mockResolvedValue(fakeUser as never);
    mockedRepo.createSession.mockResolvedValue({ id: "session-1" } as never);
    mockedRepo.rotateSession.mockResolvedValue({} as never);

    const result = await authService.register(
      { firstName: "Jonas", lastName: "Berg", email: "jonas@waypoint.app", password: "Passw0rd!" },
      ctx,
    );

    expect(mockedRepo.getDefaultRole).toHaveBeenCalledWith("TEAM_MEMBER");
    expect(result.user.email).toBe("jonas@waypoint.app");
    expect(result.tokens.accessToken).toBe("access-token");
  });
});

describe("authService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an unknown email without revealing whether the account exists", async () => {
    mockedRepo.findUserByEmail.mockResolvedValue(null);
    await expect(
      authService.login({ email: "nobody@waypoint.app", password: "whatever", rememberMe: false }, ctx),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a deactivated account even with the correct password", async () => {
    mockedRepo.findUserByEmail.mockResolvedValue({ ...fakeUser, isActive: false } as never);
    await expect(
      authService.login({ email: fakeUser.email, password: "Passw0rd!", rememberMe: false }, ctx),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects an incorrect password", async () => {
    const { verifyPassword } = await import("../../../lib/hash");
    vi.mocked(verifyPassword).mockResolvedValue(false);
    mockedRepo.findUserByEmail.mockResolvedValue(fakeUser as never);

    await expect(
      authService.login({ email: fakeUser.email, password: "wrong", rememberMe: false }, ctx),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("issues tokens on a correct password for an active account", async () => {
    const { verifyPassword } = await import("../../../lib/hash");
    vi.mocked(verifyPassword).mockResolvedValue(true);
    mockedRepo.findUserByEmail.mockResolvedValue(fakeUser as never);
    mockedRepo.createSession.mockResolvedValue({ id: "session-1" } as never);
    mockedRepo.rotateSession.mockResolvedValue({} as never);

    const result = await authService.login(
      { email: fakeUser.email, password: "Passw0rd!", rememberMe: false },
      ctx,
    );

    expect(result.tokens.accessToken).toBe("access-token");
    expect(result.user.id).toBe(fakeUser.id);
  });
});
