import { describe, expect, it, vi, beforeEach } from "vitest";
import { projectsService } from "../projects.service";
import { projectsRepository } from "../projects.repository";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../common/errors";

vi.mock("../projects.repository", () => ({
  projectsRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findMembership: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
    softDelete: vi.fn(),
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  },
}));
vi.mock("../../../common/activityLogger", () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

const mockedRepo = vi.mocked(projectsRepository);

const baseProject = {
  id: "project-1",
  ownerId: "owner-1",
  status: "ACTIVE" as const,
  members: [{ userId: "member-1" }],
};

describe("projectsService.getById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NotFoundError when the project does not exist", async () => {
    mockedRepo.findById.mockResolvedValue(null as never);
    await expect(
      projectsService.getById("missing", { id: "user-1", roleName: "TEAM_MEMBER" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError (not Forbidden) when a non-member tries to view a project", async () => {
    mockedRepo.findById.mockResolvedValue(baseProject as never);
    await expect(
      projectsService.getById("project-1", { id: "stranger", roleName: "TEAM_MEMBER" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("allows a project member to view the project", async () => {
    mockedRepo.findById.mockResolvedValue(baseProject as never);
    const result = await projectsService.getById("project-1", { id: "member-1", roleName: "TEAM_MEMBER" });
    expect(result).toEqual(baseProject);
  });

  it("allows an Administrator to view any project regardless of membership", async () => {
    mockedRepo.findById.mockResolvedValue(baseProject as never);
    const result = await projectsService.getById("project-1", { id: "someone-else", roleName: "ADMINISTRATOR" });
    expect(result).toEqual(baseProject);
  });
});

describe("projectsService.archive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a Team Member who is only a CONTRIBUTOR, not project MANAGER", async () => {
    mockedRepo.findById.mockResolvedValue(baseProject as never);
    mockedRepo.findMembership.mockResolvedValue({ role: "CONTRIBUTOR" } as never);

    await expect(
      projectsService.archive("project-1", { id: "member-1", roleName: "TEAM_MEMBER" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(mockedRepo.archive).not.toHaveBeenCalled();
  });

  it("allows the project owner to archive their own project", async () => {
    mockedRepo.findById.mockResolvedValue(baseProject as never);
    mockedRepo.archive.mockResolvedValue({ ...baseProject, status: "ARCHIVED" } as never);

    const result = await projectsService.archive("project-1", { id: "owner-1", roleName: "PROJECT_MANAGER" });
    expect(result.status).toBe("ARCHIVED");
    expect(mockedRepo.archive).toHaveBeenCalledWith("project-1");
  });

  it("rejects archiving a project that is already archived", async () => {
    mockedRepo.findById.mockResolvedValue({ ...baseProject, status: "ARCHIVED" } as never);
    await expect(
      projectsService.archive("project-1", { id: "owner-1", roleName: "PROJECT_MANAGER" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("projectsService.removeMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses to remove the project owner from their own project", async () => {
    mockedRepo.findById.mockResolvedValue(baseProject as never);
    await expect(
      projectsService.removeMember("project-1", "owner-1", { id: "owner-1", roleName: "PROJECT_MANAGER" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockedRepo.removeMember).not.toHaveBeenCalled();
  });
});
