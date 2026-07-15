import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  ROLE_NAMES,
} from "../apps/api/src/common/permissions";

const prisma = new PrismaClient();

const PERMISSION_LABELS: Record<string, { label: string; domain: string }> = {
  [PERMISSIONS.USER_MANAGE]: { label: "Manage users", domain: "user" },
  [PERMISSIONS.ROLE_MANAGE]: { label: "Manage roles", domain: "user" },
  [PERMISSIONS.PERMISSION_MANAGE]: { label: "Manage permissions", domain: "user" },
  [PERMISSIONS.TEAM_MANAGE]: { label: "Manage teams", domain: "team" },
  [PERMISSIONS.TEAM_VIEW]: { label: "View teams", domain: "team" },
  [PERMISSIONS.PROJECT_CREATE]: { label: "Create projects", domain: "project" },
  [PERMISSIONS.PROJECT_UPDATE]: { label: "Edit projects", domain: "project" },
  [PERMISSIONS.PROJECT_DELETE]: { label: "Delete projects", domain: "project" },
  [PERMISSIONS.PROJECT_ARCHIVE]: { label: "Archive projects", domain: "project" },
  [PERMISSIONS.PROJECT_RESTORE]: { label: "Restore projects", domain: "project" },
  [PERMISSIONS.PROJECT_VIEW]: { label: "View projects", domain: "project" },
  [PERMISSIONS.PROJECT_MANAGE_MEMBERS]: { label: "Manage project members", domain: "project" },
  [PERMISSIONS.TASK_CREATE]: { label: "Create tasks", domain: "task" },
  [PERMISSIONS.TASK_UPDATE]: { label: "Edit tasks", domain: "task" },
  [PERMISSIONS.TASK_DELETE]: { label: "Delete tasks", domain: "task" },
  [PERMISSIONS.TASK_VIEW]: { label: "View tasks", domain: "task" },
  [PERMISSIONS.TASK_COMMENT]: { label: "Comment on tasks", domain: "task" },
  [PERMISSIONS.ANALYTICS_VIEW]: { label: "View analytics", domain: "analytics" },
  [PERMISSIONS.REPORTS_VIEW]: { label: "View reports", domain: "analytics" },
  [PERMISSIONS.ACTIVITY_LOG_VIEW]: { label: "View activity logs", domain: "system" },
};

async function main() {
  console.log("Seeding permissions...");
  for (const [key, meta] of Object.entries(PERMISSION_LABELS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { label: meta.label, domain: meta.domain },
      create: { key, label: meta.label, domain: meta.domain },
    });
  }

  console.log("Seeding roles...");
  const roles: Record<string, { id: string }> = {};
  for (const roleName of Object.values(ROLE_NAMES)) {
    roles[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  console.log("Wiring role → permission grants...");
  for (const [roleName, permissionKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = roles[roleName];
    const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log("Seeding demo users...");
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@waypoint.app" },
    update: {},
    create: {
      email: "admin@waypoint.app",
      firstName: "Amara",
      lastName: "Okafor",
      passwordHash,
      roleId: roles[ROLE_NAMES.ADMINISTRATOR].id,
      jobTitle: "Head of Operations",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "priya@waypoint.app" },
    update: {},
    create: {
      email: "priya@waypoint.app",
      firstName: "Priya",
      lastName: "Sharma",
      passwordHash,
      roleId: roles[ROLE_NAMES.PROJECT_MANAGER].id,
      jobTitle: "Senior Project Manager",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} },
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "jonas@waypoint.app" },
    update: {},
    create: {
      email: "jonas@waypoint.app",
      firstName: "Jonas",
      lastName: "Berg",
      passwordHash,
      roleId: roles[ROLE_NAMES.TEAM_MEMBER].id,
      jobTitle: "Frontend Engineer",
      emailVerifiedAt: new Date(),
      notificationPrefs: { create: {} },
    },
  });

  console.log("Seeding a demo team and project...");
  const team = await prisma.team.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Product Engineering",
      description: "Core product squad",
      members: {
        create: [{ userId: admin.id }, { userId: manager.id }, { userId: member.id }],
      },
    },
  });

  const existingProject = await prisma.project.findFirst({ where: { slug: "mobile-app-redesign-demo" } });
  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        name: "Mobile App Redesign",
        slug: "mobile-app-redesign-demo",
        description: "Refresh the mobile experience with the new design system.",
        status: "ACTIVE",
        priority: "HIGH",
        ownerId: manager.id,
        teamId: team.id,
        startDate: new Date(),
        members: {
          create: [
            { userId: manager.id, role: "MANAGER" },
            { userId: member.id, role: "CONTRIBUTOR" },
          ],
        },
        labels: {
          create: [
            { name: "Design", color: "#3730A5" },
            { name: "Bug", color: "#DC2626" },
            { name: "Backend", color: "#0F9D6E" },
          ],
        },
        milestones: {
          create: [
            { title: "Design handoff", order: 0, dueDate: new Date(Date.now() + 7 * 86400000) },
            { title: "Beta launch", order: 1, dueDate: new Date(Date.now() + 21 * 86400000) },
          ],
        },
      },
    });

    await prisma.task.createMany({
      data: [
        {
          projectId: project.id,
          title: "Audit current onboarding flow",
          status: "DONE",
          priority: "MEDIUM",
          creatorId: manager.id,
          assigneeId: member.id,
          position: 0,
        },
        {
          projectId: project.id,
          title: "Design new empty states",
          status: "IN_PROGRESS",
          priority: "HIGH",
          creatorId: manager.id,
          assigneeId: member.id,
          position: 1,
          dueDate: new Date(Date.now() + 4 * 86400000),
        },
        {
          projectId: project.id,
          title: "Implement Kanban drag-and-drop",
          status: "TODO",
          priority: "HIGH",
          creatorId: manager.id,
          assigneeId: member.id,
          position: 2,
        },
      ],
    });
  }

  console.log("✅ Seed complete.");
  console.log("   admin@waypoint.app / priya@waypoint.app / jonas@waypoint.app — password: Password123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
